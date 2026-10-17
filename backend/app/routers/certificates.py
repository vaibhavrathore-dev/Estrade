from datetime import datetime, timezone
from uuid import uuid4
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, Participation, Certificate, EventRegistration, Attendance
from app.services.access import get_event, can_manage
from app.services.certificates import certificate_pdf, certificate_hash
from app.services.email_delivery import send_certificate_email
router = APIRouter(prefix='/api/v1', tags=['Certificates'])

class ConfirmParticipation(BaseModel):
    email: EmailStr
    evidence: str = Field(min_length=5, max_length=2000)

@router.post('/events/{event_id}/participations', status_code=201)
def confirm(event_id: UUID, data: ConfirmParticipation, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id, manage=True)
    if event.status != 'confirmed' or event.ends_at > datetime.now(timezone.utc):
        raise HTTPException(422, 'Participation can only be verified after a confirmed event has ended')
    target = db.scalar(select(User).where(User.email == str(data.email).lower(), User.is_active.is_(True)))
    if target is None:
        raise HTTPException(422, 'No active participant account with that email')
    from app.models import Event
    db.execute(select(Event).where(Event.id == event_id).with_for_update())
    count = db.scalar(select(func.count()).select_from(Participation).where(Participation.event_id == event_id))
    existing = db.scalar(select(Participation).where(Participation.event_id == event_id, Participation.user_id == target.id))
    if existing:
        raise HTTPException(409, 'Participation is already verified')
    if event.max_participants is not None and count >= event.max_participants:
        raise HTTPException(409, 'Event participant capacity reached')
    record = Participation(event_id=event_id, user_id=target.id, verified_by=user.id, evidence=data.evidence)
    db.add(record)
    db.commit()
    return {'id': record.id, 'full_name': target.full_name}


@router.post('/registrations/{registration_id}/participation', status_code=201)
def approve_registered_participation(
    registration_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    registration = db.get(EventRegistration, registration_id)

    if registration is None:
        raise HTTPException(404, 'Registration not found')

    event = get_event(
        db,
        user,
        registration.event_id,
        manage=True,
    )

    if event.status != 'confirmed' or event.ends_at > datetime.now(timezone.utc):
        raise HTTPException(
            422,
            'Participation can only be approved after the confirmed event has ended',
        )

    attendance = db.scalar(
        select(Attendance).where(
            Attendance.registration_id == registration.id
        )
    )

    if attendance is None:
        raise HTTPException(
            422,
            'Participant must complete QR check-in before participation can be verified',
        )

    existing = db.scalar(
        select(Participation).where(
            Participation.event_id == event.id,
            Participation.user_id == registration.user_id,
        )
    )

    if existing:
        participant = db.get(User, registration.user_id)
        return {
            'id': existing.id,
            'full_name': participant.full_name,
            'certificate_name': registration.certificate_name,
            'verified': True,
            'source': 'qr_attendance',
        }

    record = Participation(
        event_id=event.id,
        user_id=registration.user_id,
        verified_by=user.id,
        evidence='Verified through Estrade QR attendance',
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    participant = db.get(User, registration.user_id)

    return {
        'id': record.id,
        'full_name': participant.full_name,
        'certificate_name': registration.certificate_name,
        'verified': True,
        'source': 'qr_attendance',
    }


@router.get('/events/{event_id}/participations')
def participants(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id)
    query = select(Participation, User).join(User, User.id == Participation.user_id).where(Participation.event_id == event_id)
    if not can_manage(db, user, event.committee_id):
        query = query.where(Participation.user_id == user.id)
    return [{'id': p.id, 'user_id': p.user_id, 'full_name': u.full_name,
             'certificate_id': db.scalar(select(Certificate.id).where(Certificate.participation_id == p.id))}
            for p, u in db.execute(query)]

@router.post('/participations/{participation_id}/certificates', status_code=201)
def issue(participation_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    participation = db.get(Participation, participation_id)
    if not participation:
        raise HTTPException(404, 'Verified participation not found')
    event = get_event(db, user, participation.event_id, manage=True)
    if event.status != 'confirmed' or event.ends_at > datetime.now(timezone.utc):
        raise HTTPException(422, 'Only completed confirmed events are eligible')
    participant = db.get(User, participation.user_id)

    registration = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == participation.user_id,
            EventRegistration.status == 'registered',
        )
    )

    if registration is None:
        raise HTTPException(
            422,
            'A valid Estrade event registration is required before certificate issuance',
        )

    attendance = db.scalar(
        select(Attendance).where(
            Attendance.registration_id == registration.id
        )
    )

    if attendance is None:
        raise HTTPException(
            422,
            'Verified QR attendance is required before certificate issuance',
        )

    record = Certificate(
        participation_id=participation.id,
        issued_by=user.id,
        participant_name=registration.certificate_name,
        event_title=event.title,
        event_date=event.starts_at,
        college_name='Amritsar Group of Colleges',
        department_name='Department of Computer Science & Engineering',
        signatory_name='Head of Department',
        verification_code=f'EST-{uuid4().hex[:12].upper()}',
        delivery_status='pending',
    )

    db.add(record)

    try:
        db.flush()

        pdf_bytes = certificate_pdf(record)
        record.file_hash_sha256 = certificate_hash(pdf_bytes)

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Certificate already issued for this participation and type')
    try:
        send_certificate_email(
            recipient_email=participant.email,
            participant_name=record.participant_name,
            event_title=record.event_title,
            event_date=record.event_date,
            certificate_code=record.verification_code,
            pdf_bytes=certificate_pdf(record),
        )

        record.delivery_status = 'sent'
        record.emailed_at = datetime.now(timezone.utc)

    except Exception:
        record.delivery_status = 'failed'
        record.emailed_at = None

    db.commit()

    return {
        'id': record.id,
        'download_url': f'/api/v1/certificates/{record.id}/download',
        'verification_code': record.verification_code,
        'delivery_status': record.delivery_status,
    }

@router.get('/certificates/{certificate_id}/download')
def download(certificate_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = db.get(Certificate, certificate_id)
    if record is None:
        raise HTTPException(404, 'Certificate not found')
    participation = db.get(Participation, record.participation_id)
    if user.id != participation.user_id:
        get_event(db, user, participation.event_id, manage=True)
    return Response(certificate_pdf(record), media_type='application/pdf', headers={
        'Content-Disposition': f'attachment; filename="estrade-{record.id}.pdf"', 'Cache-Control': 'private, no-store'})

@router.get('/certificates/{certificate_id}/verify')
def verify(certificate_id: UUID, db: Session = Depends(get_db)):
    record = db.get(Certificate, certificate_id)

    if record is None:
        raise HTTPException(404, 'Certificate not found')

    return {
        'id': record.id,
        'verification_code': record.verification_code,
        'valid': True,
        'certificate_type': record.certificate_type,
        'issued_at': record.created_at,
    }


@router.get('/certificate-verification/{verification_code}')
def verify_by_code(
    verification_code: str,
    db: Session = Depends(get_db),
):
    record = db.scalar(
        select(Certificate).where(
            Certificate.verification_code == verification_code
        )
    )

    if record is None:
        raise HTTPException(
            404,
            'Certificate not found',
        )

    return {
        'valid': True,
        'verification_code': record.verification_code,
        'participant_name': record.participant_name,
        'event_title': record.event_title,
        'event_date': record.event_date,
        'college_name': record.college_name,
        'department_name': record.department_name,
        'certificate_type': record.certificate_type,
        'issued_at': record.created_at,
    }



@router.post('/certificates/{certificate_id}/email')
def retry_certificate_email(
    certificate_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.get(Certificate, certificate_id)

    if record is None:
        raise HTTPException(
            404,
            'Certificate not found',
        )

    participation = db.get(
        Participation,
        record.participation_id,
    )

    event = get_event(
        db,
        user,
        participation.event_id,
        manage=True,
    )

    participant = db.get(
        User,
        participation.user_id,
    )

    try:
        message_id = send_certificate_email(
            recipient_email=participant.email,
            participant_name=record.participant_name,
            event_title=record.event_title,
            event_date=record.event_date,
            certificate_code=record.verification_code,
            pdf_bytes=certificate_pdf(record),
        )

        record.delivery_status = 'sent'
        record.emailed_at = datetime.now(timezone.utc)

        db.commit()

        return {
            'certificate_id': record.id,
            'delivery_status': 'sent',
            'message_id': message_id,
        }

    except Exception:
        record.delivery_status = 'failed'
        record.emailed_at = None
        db.commit()

        raise HTTPException(
            502,
            'Certificate exists, but email delivery failed',
        )


@router.get('/certificates/{certificate_id}/delivery')
def certificate_delivery_status(
    certificate_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.get(Certificate, certificate_id)

    if record is None:
        raise HTTPException(
            404,
            'Certificate not found',
        )

    participation = db.get(
        Participation,
        record.participation_id,
    )

    if user.id != participation.user_id:
        get_event(
            db,
            user,
            participation.event_id,
            manage=True,
        )

    return {
        'certificate_id': record.id,
        'delivery_status': record.delivery_status,
        'emailed_at': record.emailed_at,
    }


@router.get('/certificates')
def my_certificates(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Recipients can find their own certificates even for private committee events."""
    records = db.scalars(select(Certificate).join(Participation, Participation.id == Certificate.participation_id)
                         .where(Participation.user_id == user.id).order_by(Certificate.created_at.desc()))
    return [{'id': c.id, 'event_title': c.event_title, 'event_date': c.event_date,
             'certificate_type': c.certificate_type, 'issued_at': c.created_at} for c in records]
