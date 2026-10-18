from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Committee, CommitteeMember, User, Venue, Event, Assignment
from app.services.access import memberships, can_manage

router = APIRouter(prefix='/api/v1', tags=['Workspaces'])

@router.get('/venues')
def venues(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{'id': v.id, 'name': v.name, 'capacity': v.capacity} for v in db.scalars(
        select(Venue).where(Venue.is_active.is_(True)).order_by(Venue.name))]

@router.get('/committees')
def committees(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    own = {m.committee_id: m for m in db.scalars(select(CommitteeMember).where(CommitteeMember.user_id == user.id))}
    query = select(Committee).order_by(Committee.name)
    if user.user_type != 'admin':
        query = query.where(Committee.is_active.is_(True))
    return [{'id': c.id, 'name': c.name, 'description': c.description,
             'role': own[c.id].committee_role if c.id in own else None,
             'membership_status': own[c.id].verification_status if c.id in own else None,
             'is_active': c.is_active,
             'can_manage': c.is_active and can_manage(db, user, c.id)}
            for c in db.scalars(query)]

@router.get('/committees/{committee_id}/members')
def members(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.user_type != 'admin' and db.scalar(memberships(user).where(CommitteeMember.committee_id == committee_id)) is None:
        raise HTTPException(403, 'Approved committee membership required')
    return [{'id': m.user_id, 'full_name': u.full_name, 'role': m.committee_role,
             'verification_status': m.verification_status}
            for m, u in db.execute(select(CommitteeMember, User).join(User, User.id == CommitteeMember.user_id)
            .where(CommitteeMember.committee_id == committee_id))]

from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Literal
from sqlalchemy.exc import IntegrityError
from app.services.access import require_manager

class JoinRequest(BaseModel):
    reason: str = Field(default='', max_length=2000)

class MembershipReview(BaseModel):
    status: Literal['approved', 'rejected']

@router.post('/committees/{committee_id}/applications', status_code=201)
def apply(committee_id: UUID, data: JoinRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.user_type != 'student':
        raise HTTPException(403, 'Only students can request coordinator membership')
    if db.get(Committee, committee_id) is None:
        raise HTTPException(404, 'Committee not found')
    record = CommitteeMember(committee_id=committee_id, user_id=user.id, committee_role='coordinator',
                             verification_status='pending', request_reason=data.reason)
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'A membership or application already exists')
    return {'id': record.id, 'status': record.verification_status}

@router.get('/committees/{committee_id}/applications')
def applications(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_manager(db, user, committee_id)
    return [{'id': m.id, 'full_name': u.full_name, 'role': m.committee_role, 'status': m.verification_status,
             'reason': m.request_reason, 'requested_at': m.created_at}
            for m, u in db.execute(select(CommitteeMember, User).join(User, User.id == CommitteeMember.user_id)
                .where(CommitteeMember.committee_id == committee_id).order_by(CommitteeMember.created_at))]

@router.patch('/committee-applications/{application_id}')
def review_application(application_id: UUID, data: MembershipReview, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = db.scalar(select(CommitteeMember).where(CommitteeMember.id == application_id).with_for_update())
    if record is None:
        raise HTTPException(404, 'Application not found')
    require_manager(db, user, record.committee_id)
    if record.user_id == user.id:
        raise HTTPException(403, 'You cannot review your own application')
    if record.verification_status != 'pending' or record.committee_role != 'coordinator':
        raise HTTPException(409, 'This coordinator application cannot be reviewed')
    record.verification_status = data.status
    record.verified_by = user.id
    record.verified_at = datetime.now(timezone.utc)
    db.commit()
    return {'id': record.id, 'status': record.verification_status}

class VenueCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    capacity: int = Field(ge=1, le=100000)

    @field_validator('name')
    @classmethod
    def normalize_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise ValueError('Venue name must contain at least 2 characters')
        return name


def require_admin(user: User):
    if user.user_type != 'admin':
        raise HTTPException(403, 'Administrator access required')


@router.post('/venues', status_code=201)
def create_venue(data: VenueCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)
    if db.scalar(select(Venue.id).where(func.lower(Venue.name) == data.name.lower())):
        raise HTTPException(409, 'A venue with this name already exists')
    venue = Venue(name=data.name, capacity=data.capacity, is_active=True)
    db.add(venue)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'A venue with this name already exists')
    db.refresh(venue)
    return {'id': venue.id, 'name': venue.name, 'capacity': venue.capacity, 'is_active': venue.is_active}


@router.delete('/committees/{committee_id}')
def archive_committee(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)
    committee = db.scalar(select(Committee).where(Committee.id == committee_id).with_for_update())
    if committee is None:
        raise HTTPException(404, 'Committee not found')
    committee.is_active = False
    db.commit()
    return {'id': committee.id, 'is_active': False, 'message': 'Committee archived; events and certificates retained'}


@router.post('/committees/{committee_id}/restore')
def restore_committee(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)
    committee = db.scalar(select(Committee).where(Committee.id == committee_id).with_for_update())
    if committee is None:
        raise HTTPException(404, 'Committee not found')
    committee.is_active = True
    db.commit()
    return {'id': committee.id, 'is_active': True}


@router.delete('/committees/{committee_id}/members/{member_user_id}')
def remove_committee_member(
    committee_id: UUID, member_user_id: UUID,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    require_admin(user)
    if db.get(Committee, committee_id) is None:
        raise HTTPException(404, 'Committee not found')
    membership = db.scalar(select(CommitteeMember).where(
        CommitteeMember.committee_id == committee_id,
        CommitteeMember.user_id == member_user_id,
    ).with_for_update())
    if membership is None:
        raise HTTPException(404, 'Member not found in this committee')

    # Do not orphan an in-progress or future duty; past assignment history survives.
    active = db.scalar(select(Assignment.id).join(Event, Event.id == Assignment.event_id).where(
        Assignment.user_id == member_user_id,
        Assignment.status == 'active',
        Event.committee_id == committee_id,
        Event.status != 'cancelled',
        Event.ends_at > datetime.now(timezone.utc),
    ).limit(1))
    if active is not None:
        raise HTTPException(409, "Resolve this member’s active/future coordinator duties first")
    db.delete(membership)
    db.commit()
    return {'removed_user_id': member_user_id, 'committee_id': committee_id}
