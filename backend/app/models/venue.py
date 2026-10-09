import uuid

from sqlalchemy import (
    String, Integer, Boolean,
    CheckConstraint, Uuid
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Venue(Base):
    __tablename__ = "venues"

    __table_args__ = (
        CheckConstraint(
            "capacity > 0",
            name="ck_venues_positive_capacity"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true"
    )

    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="venue"
    )
