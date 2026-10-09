import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Uuid,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Event(Base):
    __tablename__ = "events"

    __table_args__ = (
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_events_valid_times"
        ),
        CheckConstraint(
            "status IN ('draft', 'confirmed', 'cancelled')",
            name="ck_events_valid_status"
        ),
        CheckConstraint(
            "max_participants IS NULL OR max_participants > 0",
            name="ck_events_positive_capacity"
        ),
        Index(
            "ix_events_committee_starts_at",
            "committee_id",
            "starts_at"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    committee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("committees.id", ondelete="RESTRICT"),
        nullable=False
    )

    venue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venues.id", ondelete="RESTRICT"),
        nullable=False
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="draft"
    )

    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false"
    )

    max_participants: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    committee: Mapped["Committee"] = relationship(
        "Committee"
    )

    venue: Mapped["Venue"] = relationship(
        "Venue",
        back_populates="events"
    )

    creator: Mapped["User"] = relationship(
        "User"
    )
