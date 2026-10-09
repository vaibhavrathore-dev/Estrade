from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, Event, Assignment, Withdrawal, Participation, Certificate, MediaAnalysis
from app.services.access import visible_events, memberships
router = APIRouter(prefix='/api/v1', tags=['Dashboard'])

@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    events = db.scalars(visible_events(user)).all()
    private_ids = [e.id for e in events if user.user_type == 'admin' or e.committee_id in db.scalars(memberships(user)).all()]
    active = db.scalars(select(Assignment).where(Assignment.event_id.in_(private_ids), Assignment.status == 'active')).all()
    pending = db.scalar(select(func.count()).select_from(Withdrawal).join(Assignment).where(
        Assignment.event_id.in_(private_ids), Withdrawal.status == 'pending'))
    participants = db.scalar(select(func.count()).select_from(Participation).where(Participation.event_id.in_(private_ids)))
    media = db.scalars(select(MediaAnalysis).where(MediaAnalysis.event_id.in_(private_ids)).order_by(MediaAnalysis.created_at.desc()).limit(10)).all()
    return {'upcoming': sum(e.status == 'confirmed' and e.starts_at > now for e in events),
            'ongoing': sum(e.status == 'confirmed' and e.starts_at <= now < e.ends_at for e in events),
            'completed': sum(e.status == 'confirmed' and e.ends_at <= now for e in events),
            'participants': participants, 'coordinators': len({a.user_id for a in active}), 'pending_withdrawals': pending,
            'event_metrics': {str(e.id): {'coordinators': sum(a.event_id == e.id for a in active),
                'participants': db.scalar(select(func.count()).select_from(Participation).where(Participation.event_id == e.id))}
                for e in events if e.id in private_ids},
            'media': [{'event_id': m.event_id, 'summary': m.result['summary'], 'created_at': m.created_at} for m in media]}
