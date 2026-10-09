
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.committee import Committee
from app.models.committee_member import CommitteeMember
from app.models.venue import Venue
from app.models.event import Event
from app.schemas.event import EventCreate


class EventPermissionError(Exception):
    pass


class EventResourceError(Exception):
    pass


class VenueConflictError(Exception):
    pass


def create_event(
    db: Session,
    data: EventCreate,
    actor_id: UUID,
) -> Event:

    # 1. Verify the user
    actor = db.get(User, actor_id)

    if actor is None or not actor.is_active:
        raise EventPermissionError(
            "User is not authorized to create events"
        )

    # 2. Verify committee exists
    committee = db.get(Committee, data.committee_id)

    if committee is None:
        raise EventResourceError("Committee not found")

    # 3. Verify committee permissions
    if actor.user_type != "admin":
        membership = db.scalar(
            select(CommitteeMember).where(
                CommitteeMember.committee_id == data.committee_id,
                CommitteeMember.user_id == actor_id,
                CommitteeMember.verification_status == "approved",
                CommitteeMember.committee_role.in_(
                    ["head", "executive"]
                ),
            )
        )

        if membership is None:
            raise EventPermissionError(
                "Only approved committee heads or "
                "executives can create events"
            )

    # 4. Verify venue
    venue = db.get(Venue, data.venue_id)

    if venue is None or not venue.is_active:
        raise EventResourceError(
            "Venue does not exist or is inactive"
        )

    # 5. Check venue capacity
    if (
        data.max_participants is not None
        and data.max_participants > venue.capacity
    ):
        raise EventResourceError(
            "Maximum participants exceed venue capacity"
        )

    # 6. Pre-check overlapping confirmed events
    if data.status == "confirmed":
        conflict = db.scalar(
            select(Event).where(
                Event.venue_id == data.venue_id,
                Event.status == "confirmed",
                Event.starts_at < data.ends_at,
                Event.ends_at > data.starts_at,
            ).limit(1)
        )

        if conflict is not None:
            raise VenueConflictError(
                "Venue is already booked for this time"
            )

    # 7. Create the event
    event = Event(
        title=data.title,
        description=data.description,
        committee_id=data.committee_id,
        venue_id=data.venue_id,
        created_by=actor_id,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        max_participants=data.max_participants,
        status=data.status,
        is_published=False,
    )

    db.add(event)

    try:
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        # PostgreSQL exclusion constraint violation
        sqlstate = getattr(
            exc.orig,
            "sqlstate",
            None,
        )

        if sqlstate == "23P01":
            raise VenueConflictError(
                "Venue is already booked for this time"
            ) from exc

        raise

    db.refresh(event)

    return event

