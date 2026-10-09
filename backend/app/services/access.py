from fastapi import HTTPException
from sqlalchemy import select, or_
from app.models import CommitteeMember, Event


def memberships(user, manage=False):
    query = select(CommitteeMember.committee_id).where(
        CommitteeMember.user_id == user.id,
        CommitteeMember.verification_status == 'approved')
    if manage:
        query = query.where(CommitteeMember.committee_role.in_(['head', 'executive']))
    return query


def visible_events(user):
    query = select(Event)
    if user.user_type != 'admin':
        query = query.where(or_(Event.is_published.is_(True), Event.committee_id.in_(memberships(user))))
    return query


def can_manage(db, user, committee_id):
    return user.user_type == 'admin' or db.scalar(memberships(user, True).where(
        CommitteeMember.committee_id == committee_id)) is not None


def require_manager(db, user, committee_id):
    if not can_manage(db, user, committee_id):
        raise HTTPException(403, 'Only admins or approved committee heads/executives can perform this action')


def get_event(db, user, event_id, manage=False):
    event = db.scalar(visible_events(user).where(Event.id == event_id))
    if event is None:
        raise HTTPException(404, 'Event not found')
    if manage:
        require_manager(db, user, event.committee_id)
    return event
