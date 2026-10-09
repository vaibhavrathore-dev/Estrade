
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import (
    create_event,
    EventPermissionError,
    EventResourceError,
    VenueConflictError,
)

router = APIRouter(
    prefix="/api/v1/events",
    tags=["Events"],
)


@router.get("", response_model=list[EventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Event)
        .where(Event.is_published.is_(True))
        .order_by(Event.starts_at)
        .limit(100)
    ).all()


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_event(
            db=db,
            data=data,
            actor_id=current_user.id,
        )

    except EventPermissionError as exc:
        raise HTTPException(403, detail=str(exc))

    except EventResourceError as exc:
        raise HTTPException(422, detail=str(exc))

    except VenueConflictError as exc:
        raise HTTPException(409, detail=str(exc))
