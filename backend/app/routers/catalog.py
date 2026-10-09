from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Committee, CommitteeMember, User, Venue
from app.services.access import memberships, can_manage

router = APIRouter(prefix='/api/v1', tags=['Workspaces'])

@router.get('/venues')
def venues(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{'id': v.id, 'name': v.name, 'capacity': v.capacity} for v in db.scalars(
        select(Venue).where(Venue.is_active.is_(True)).order_by(Venue.name))]

@router.get('/committees')
def committees(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    own = {m.committee_id: m for m in db.scalars(select(CommitteeMember).where(CommitteeMember.user_id == user.id))}
    return [{'id': c.id, 'name': c.name, 'description': c.description,
             'role': own[c.id].committee_role if c.id in own else None,
             'membership_status': own[c.id].verification_status if c.id in own else None,
             'can_manage': can_manage(db, user, c.id)}
            for c in db.scalars(select(Committee).order_by(Committee.name))]

@router.get('/committees/{committee_id}/members')
def members(committee_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.user_type != 'admin' and db.scalar(memberships(user).where(CommitteeMember.committee_id == committee_id)) is None:
        raise HTTPException(403, 'Approved committee membership required')
    return [{'id': m.user_id, 'full_name': u.full_name, 'role': m.committee_role,
             'verification_status': m.verification_status}
            for m, u in db.execute(select(CommitteeMember, User).join(User, User.id == CommitteeMember.user_id)
            .where(CommitteeMember.committee_id == committee_id))]
