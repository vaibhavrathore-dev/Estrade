from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, Participation, Certificate
from app.services.access import get_event, can_manage
from app.services.certificates import certificate_pdf
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
    record = Certificate(participation_id=participation.id, issued_by=user.id, participant_name=participant.full_name,
                         event_title=event.title, event_date=event.starts_at)
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Certificate already issued for this participation and type')
    return {'id': record.id, 'download_url': f'/api/v1/certificates/{record.id}/download'}

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
    # Opaque UUID, no email, account ID, evidence, or private event title is exposed.
    return {'id': record.id, 'valid': True, 'certificate_type': record.certificate_type, 'issued_at': record.created_at}

@router.get('/certificates')
def my_certificates(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Recipients can find their own certificates even for private committee events."""
    records = db.scalars(select(Certificate).join(Participation, Participation.id == Certificate.participation_id)
                         .where(Participation.user_id == user.id).order_by(Certificate.created_at.desc()))
    return [{'id': c.id, 'event_title': c.event_title, 'event_date': c.event_date,
             'certificate_type': c.certificate_type, 'issued_at': c.created_at} for c in records]
