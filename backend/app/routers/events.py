
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
    return db.scalars(visible_events(current_user).order_by(Event.starts_at)).all()



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


from uuid import UUID
from pydantic import BaseModel
from app.services.access import visible_events, get_event

@router.get("/{event_id}", response_model=EventResponse)
def detail(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_event(db, user, event_id)

class Publication(BaseModel):
    is_published: bool

@router.patch("/{event_id}/publication", response_model=EventResponse)
def publish(event_id: UUID, data: Publication, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id, manage=True)
    if data.is_published and event.status != 'confirmed':
        raise HTTPException(422, 'Only confirmed events can be published')
    event.is_published = data.is_published
    db.commit()
    return event

@router.post("/{event_id}/cancel", response_model=EventResponse)
def cancel(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = get_event(db, user, event_id, manage=True)
    event.status = 'cancelled'
    event.is_published = False
    db.commit()
    return event
