from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import (
    Attendance,
    Event,
    EventRegistration,
    RegistrationAnswer,
    RegistrationField,
    User,
)
from app.schemas.registration import (
    CheckInRequest,
    EventRegistrationCreate,
    RegistrationFieldCreate,
)
from app.services.access import get_event

router = APIRouter(prefix="/api/v1", tags=["Registrations"])


def make_checkin_token(registration: EventRegistration, event: Event) -> str:
    now = datetime.now(timezone.utc)
    expiry = max(event.ends_at + timedelta(days=1), now + timedelta(hours=24))

    return jwt.encode(
        {
            "sub": str(registration.id),
            "event_id": str(event.id),
            "type": "event_checkin",
            "iat": now,
            "exp": expiry,
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


@router.get("/events/{event_id}/registration-fields")
def list_registration_fields(
    event_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_event(db, user, event_id)

    fields = db.scalars(
        select(RegistrationField)
        .where(RegistrationField.event_id == event_id)
        .order_by(RegistrationField.position, RegistrationField.created_at)
    ).all()

    return [
        {
            "id": field.id,
            "label": field.label,
            "field_type": field.field_type,
            "required": field.required,
            "options": field.options,
            "position": field.position,
        }
        for field in fields
    ]


@router.post(
    "/events/{event_id}/registration-fields",
    status_code=status.HTTP_201_CREATED,
)
def create_registration_field(
    event_id: UUID,
    data: RegistrationFieldCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_event(db, user, event_id, manage=True)

    allowed = {
        "text",
        "number",
        "select",
        "multiselect",
        "boolean",
        "url",
        "phone",
    }

    if data.field_type not in allowed:
        raise HTTPException(422, "Unsupported registration field type")

    if data.field_type in {"select", "multiselect"} and not data.options:
        raise HTTPException(422, "Select fields require options")

    record = RegistrationField(
        event_id=event_id,
        label=data.label.strip(),
        field_type=data.field_type,
        required=data.required,
        options=data.options,
        position=data.position,
    )

    db.add(record)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "A registration field with this label already exists",
        )

    db.refresh(record)

    return {
        "id": record.id,
        "label": record.label,
        "field_type": record.field_type,
        "required": record.required,
        "options": record.options,
        "position": record.position,
    }


@router.post(
    "/events/{event_id}/registrations",
    status_code=status.HTTP_201_CREATED,
)
def register_for_event(
    event_id: UUID,
    data: EventRegistrationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    event = get_event(db, user, event_id)

    if user.user_type != "student":
        raise HTTPException(
            403,
            "Only students can register as participants",
        )

    if event.status != "confirmed" or not event.is_published:
        raise HTTPException(
            422,
            "Registration is only available for published confirmed events",
        )

    if event.ends_at <= datetime.now(timezone.utc):
        raise HTTPException(
            422,
            "Registration is closed because the event has ended",
        )

    db.execute(
        select(Event)
        .where(Event.id == event.id)
        .with_for_update()
    )

    existing = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == user.id,
            EventRegistration.status == "registered",
        )
    )

    if existing:
        raise HTTPException(
            409,
            "You are already registered for this event",
        )

    if event.max_participants is not None:
        count = db.scalar(
            select(func.count())
            .select_from(EventRegistration)
            .where(
                EventRegistration.event_id == event.id,
                EventRegistration.status == "registered",
            )
        )

        if count >= event.max_participants:
            raise HTTPException(
                409,
                "This event has reached participant capacity",
            )

    fields = db.scalars(
        select(RegistrationField).where(
            RegistrationField.event_id == event.id
        )
    ).all()

    field_map = {field.id: field for field in fields}
    answer_map = {
        answer.field_id: answer.value
        for answer in data.answers
    }

    if set(answer_map) - set(field_map):
        raise HTTPException(
            422,
            "One or more answers belong to another event",
        )

    missing = [
        field.label
        for field in fields
        if field.required
        and (
            field.id not in answer_map
            or answer_map[field.id] in (None, "", [])
        )
    ]

    if missing:
        raise HTTPException(
            422,
            "Missing required fields: " + ", ".join(missing),
        )

    if len(answer_map) != len(data.answers):
        raise HTTPException(422, "Duplicate field answers")
    for field_id, value in answer_map.items():
        field = field_map[field_id]
        kind = field.field_type
        valid = (
            (kind in {"text", "url", "phone"} and isinstance(value, str) and len(value) <= 2000)
            or (kind == "number" and type(value) in (int, float))
            or (kind == "boolean" and type(value) is bool)
            or (kind == "select" and value in (field.options or []))
            or (kind == "multiselect" and isinstance(value, list)
                and all(isinstance(v, str) and v in (field.options or []) for v in value))
        )
        if not valid:
            raise HTTPException(422, f"Invalid answer for {field.label}")

    certificate_name = (
        data.certificate_name.strip()
        if data.certificate_name
        else user.full_name.strip()
    )

    registration = EventRegistration(
        event_id=event.id,
        user_id=user.id,
        certificate_name=certificate_name,
        status="registered",
    )

    db.add(registration)

    try:
        db.flush()

        for field_id, value in answer_map.items():
            db.add(
                RegistrationAnswer(
                    registration_id=registration.id,
                    field_id=field_id,
                    value=value,
                )
            )

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "You are already registered for this event",
        )

    db.refresh(registration)

    return {
        "id": registration.id,
        "event_id": registration.event_id,
        "certificate_name": registration.certificate_name,
        "status": registration.status,
        "registered_at": registration.registered_at,
    }


@router.get("/me/registrations")
def my_registrations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.execute(
        select(
            EventRegistration,
            Event,
            Attendance,
        )
        .join(
            Event,
            Event.id == EventRegistration.event_id,
        )
        .outerjoin(
            Attendance,
            Attendance.registration_id == EventRegistration.id,
        )
        .where(EventRegistration.user_id == user.id)
        .order_by(Event.starts_at.desc())
    ).all()

    return [
        {
            "id": registration.id,
            "event_id": event.id,
            "event_title": event.title,
            "starts_at": event.starts_at,
            "ends_at": event.ends_at,
            "status": registration.status,
            "certificate_name": registration.certificate_name,
            "checked_in": attendance is not None,
            "checked_in_at": (
                attendance.checked_in_at
                if attendance
                else None
            ),
        }
        for registration, event, attendance in rows
    ]


@router.get("/registrations/{registration_id}/check-in-token")
def get_checkin_token(
    registration_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    registration = db.get(EventRegistration, registration_id)

    if registration is None:
        raise HTTPException(404, "Registration not found")

    event = db.get(Event, registration.event_id)

    if registration.user_id != user.id:
        get_event(db, user, event.id, manage=True)

    if registration.status != "registered":
        raise HTTPException(422, "Registration is not active")

    return {
        "registration_id": registration.id,
        "event_id": event.id,
        "event_title": event.title,
        "token": make_checkin_token(registration, event),
    }


@router.post("/check-in")
def check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        payload = jwt.decode(
            data.token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "require": [
                    "sub",
                    "event_id",
                    "iat",
                    "exp",
                ]
            },
        )

        if payload.get("type") != "event_checkin":
            raise ValueError

        registration_id = UUID(payload["sub"])
        token_event_id = UUID(payload["event_id"])

    except (
        InvalidTokenError,
        ValueError,
        TypeError,
        KeyError,
    ):
        raise HTTPException(
            422,
            "Invalid or expired check-in QR",
        )

    registration = db.get(
        EventRegistration,
        registration_id,
    )

    if (
        registration is None
        or registration.status != "registered"
        or registration.event_id != token_event_id
    ):
        raise HTTPException(
            422,
            "Registration is not valid for this event",
        )

    event = get_event(
        db,
        user,
        registration.event_id,
        manage=True,
    )

    if data.event_id is not None and data.event_id != event.id:
        raise HTTPException(422, "QR belongs to a different event")
    if event.status != "confirmed":
        raise HTTPException(422, "Check-in requires a confirmed event")

    existing = db.scalar(
        select(Attendance).where(
            Attendance.registration_id == registration.id
        )
    )

    if existing:
        raise HTTPException(
            409,
            "Participant is already checked in",
        )

    record = Attendance(
        registration_id=registration.id,
        checked_in_by=user.id,
    )

    db.add(record)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "Participant is already checked in",
        )

    db.refresh(record)

    participant = db.get(
        User,
        registration.user_id,
    )

    return {
        "status": "checked_in",
        "attendance_id": record.id,
        "participant": participant.full_name,
        "event": event.title,
        "checked_in_at": record.checked_in_at,
    }


@router.get("/events/{event_id}/attendance")
def event_attendance(
    event_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_event(
        db,
        user,
        event_id,
        manage=True,
    )

    rows = db.execute(
        select(
            Attendance,
            EventRegistration,
            User,
        )
        .join(
            EventRegistration,
            EventRegistration.id == Attendance.registration_id,
        )
        .join(
            User,
            User.id == EventRegistration.user_id,
        )
        .where(
            EventRegistration.event_id == event_id
        )
        .order_by(Attendance.checked_in_at)
    ).all()

    return [
        {
            "attendance_id": attendance.id,
            "registration_id": registration.id,
            "user_id": participant.id,
            "full_name": participant.full_name,
            "email": participant.email,
            "checked_in_at": attendance.checked_in_at,
        }
        for attendance, registration, participant in rows
    ]


@router.get("/events/{event_id}/registrations")
def event_registrations(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_event(db, user, event_id, manage=True)
    return [{"id": r.id, "user_id": u.id, "full_name": u.full_name,
             "certificate_name": r.certificate_name, "status": r.status,
             "checked_in": a is not None, "registered_at": r.registered_at}
            for r, u, a in db.execute(select(EventRegistration, User, Attendance)
                .join(User, User.id == EventRegistration.user_id)
                .outerjoin(Attendance, Attendance.registration_id == EventRegistration.id)
                .where(EventRegistration.event_id == event_id).order_by(EventRegistration.registered_at))]
