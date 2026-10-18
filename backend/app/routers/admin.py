"""Admin-controlled committee provisioning. No public role-selection or bootstrap endpoint."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Committee, CommitteeMember, User

router = APIRouter(prefix='/api/v1/admin', tags=['Administration'])


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.user_type != 'admin':
        raise HTTPException(403, 'Administrator permission required')
    return user


class CommitteeCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    description: str | None = Field(default=None, max_length=3000)
    head_user_id: UUID


class ExecutiveCreate(BaseModel):
    user_id: UUID


@router.get('/users')
def users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return [{'id':u.id, 'name':u.full_name, 'email':u.email, 'role':u.user_type}
            for u in db.scalars(select(User).where(User.is_active.is_(True), User.email_verified.is_(True)).order_by(User.full_name))]


@router.post('/users/{user_id}/faculty')
def promote_faculty(user_id: UUID, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    target = db.scalar(select(User).where(User.id == user_id).with_for_update())
    if not target or not target.is_active or not target.email_verified:
        raise HTTPException(404, 'Active verified user not found')
    if target.user_type != 'student':
        raise HTTPException(409, 'Only verified student accounts can be promoted to faculty')
    target.user_type = 'faculty'
    db.commit()
    return {'id':target.id, 'role':target.user_type}


def eligible_faculty(db: Session, user_id: UUID):
    faculty = db.scalar(select(User).where(User.id == user_id).with_for_update())
    if faculty is None or faculty.user_type != 'faculty' or not faculty.is_active or not faculty.email_verified:
        raise HTTPException(422, 'Choose an active, verified faculty account')
    return faculty


@router.post('/committees', status_code=201)
def create_committee(data: CommitteeCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    eligible_faculty(db, data.head_user_id)
    name = data.name.strip()
    if len(name) < 3:
        raise HTTPException(422, 'Committee name is too short')
    committee = Committee(name=name, description=data.description)
    try:
        db.add(committee)
        db.flush()
        db.add(CommitteeMember(committee_id=committee.id, user_id=data.head_user_id,
                               committee_role='head', verification_status='approved',
                               verified_by=admin.id, verified_at=datetime.now(timezone.utc)))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Committee already exists or membership conflicts')
    return {'id':committee.id, 'name':committee.name, 'head_user_id':data.head_user_id}


@router.post('/committees/{committee_id}/executives', status_code=201)
def add_executive(committee_id: UUID, data: ExecutiveCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    committee = db.get(Committee, committee_id)
    if committee is None:
        raise HTTPException(404, 'Committee not found')
    eligible_faculty(db, data.user_id)
    if db.scalar(select(CommitteeMember).where(CommitteeMember.committee_id == committee_id,
                                                CommitteeMember.user_id == data.user_id)):
        raise HTTPException(409, 'This person is already a committee member')
    try:
        record = CommitteeMember(committee_id=committee_id, user_id=data.user_id,
                                 committee_role='executive', verification_status='approved',
                                 verified_by=admin.id, verified_at=datetime.now(timezone.utc))
        db.add(record)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Executive assignment conflicts with existing membership')
    return {'id':record.id, 'status':'approved', 'role':'executive'}
