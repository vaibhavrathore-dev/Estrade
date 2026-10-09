from datetime import datetime, timezone
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, CommitteeMember, Event, Assignment, Withdrawal
from app.services.access import get_event, visible_events

router = APIRouter(prefix='/api/v1', tags=['Coordination'])

class AssignmentCreate(BaseModel):
    user_id: UUID
    duty: str = Field(min_length=2, max_length=150)

class WithdrawalCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)

class Review(BaseModel):
    status: Literal['approved', 'rejected']


def commit(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'This active assignment or pending request already exists')

@router.get('/events/{event_id}/assignments')
def assignments(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id)
    # Public event visibility does not grant access to the private staff roster.
    from app.services.access import memberships
    if user.user_type != 'admin' and event.committee_id not in db.scalars(memberships(user)).all():
        return []
    return [{'id': a.id, 'user_id': a.user_id, 'full_name': u.full_name,
             'duty': a.duty, 'status': a.status,
             'withdrawals': [{'id': w.id, 'reason': w.reason, 'status': w.status} for w in db.scalars(
                 select(Withdrawal).where(Withdrawal.assignment_id == a.id).order_by(Withdrawal.created_at))]}
            for a, u in db.execute(select(Assignment, User).join(User, User.id == Assignment.user_id)
                .where(Assignment.event_id == event_id).order_by(Assignment.created_at))]

@router.post('/events/{event_id}/assignments', status_code=201)
def assign(event_id: UUID, data: AssignmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id, manage=True)
    if event.status == 'cancelled':
        raise HTTPException(422, 'Cannot staff a cancelled event')
    member = db.scalar(select(CommitteeMember).where(CommitteeMember.committee_id == event.committee_id,
        CommitteeMember.user_id == data.user_id, CommitteeMember.verification_status == 'approved'))
    target = db.get(User, data.user_id)
    if not member or not target or not target.is_active:
        raise HTTPException(422, 'Choose an active approved committee member')
    # Lock the volunteer to serialize concurrent assignments to overlapping events.
    db.execute(select(User).where(User.id == data.user_id).with_for_update())
    conflict = db.scalar(select(Assignment).join(Event, Event.id == Assignment.event_id).where(
        Assignment.user_id == data.user_id, Assignment.status == 'active', Event.status != 'cancelled',
        Event.starts_at < event.ends_at, Event.ends_at > event.starts_at))
    if conflict:
        raise HTTPException(409, 'Coordinator is already assigned during this time')
    assignment = Assignment(event_id=event_id, user_id=data.user_id, assigned_by=user.id, duty=data.duty)
    db.add(assignment)
    commit(db)
    return {'id': assignment.id, 'status': assignment.status}

@router.post('/assignments/{assignment_id}/withdrawals', status_code=201)
def withdraw(assignment_id: UUID, data: WithdrawalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assignment = db.scalar(select(Assignment).where(Assignment.id == assignment_id).with_for_update())
    if assignment is None or assignment.user_id != user.id:
        raise HTTPException(404, 'Assignment not found')
    if assignment.status != 'active':
        raise HTTPException(409, 'Assignment is already withdrawn')
    request = Withdrawal(assignment_id=assignment_id, reason=data.reason)
    db.add(request)
    commit(db)
    return {'id': request.id, 'status': request.status}

@router.patch('/withdrawals/{withdrawal_id}', status_code=200)
def review(withdrawal_id: UUID, data: Review, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    request = db.scalar(select(Withdrawal).where(Withdrawal.id == withdrawal_id).with_for_update())
    if request is None:
        raise HTTPException(404, 'Request not found')
    assignment = db.get(Assignment, request.assignment_id)
    get_event(db, user, assignment.event_id, manage=True)
    if request.status != 'pending':
        raise HTTPException(409, 'Request has already been reviewed')
    request.status, request.reviewed_by, request.reviewed_at = data.status, user.id, datetime.now(timezone.utc)
    if data.status == 'approved':
        assignment.status = 'withdrawn'
    db.commit()
    return {'id': request.id, 'status': request.status}

@router.get('/committees/{committee_id}/availability')
def availability(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.access import require_manager
    require_manager(db, user, committee_id)
    # Only expose assignments within this committee; assignment creation also checks other committees.
    return [{'user_id': a.user_id, 'event_id': e.id, 'event_title': e.title,
             'starts_at': e.starts_at, 'ends_at': e.ends_at}
            for a, e in db.execute(select(Assignment, Event).join(Event, Event.id == Assignment.event_id)
            .where(Event.committee_id == committee_id, Event.status != 'cancelled', Assignment.status == 'active'))]
