import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "user_id",
            name="uq_event_registration_user",
        ),
        CheckConstraint(
            "status IN ('registered','cancelled')",
            name="ck_event_registration_status",
        ),
        Index(
            "ix_event_registrations_event_id",
            "event_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    certificate_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="registered",
    )

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RegistrationField(Base):
    __tablename__ = "registration_fields"

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "label",
            name="uq_registration_field_event_label",
        ),
        CheckConstraint(
            "field_type IN "
            "('text','number','select','multiselect','boolean','url','phone')",
            name="ck_registration_field_type",
        ),
        Index(
            "ix_registration_fields_event_id",
            "event_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    field_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="text",
    )

    required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    options: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RegistrationAnswer(Base):
    __tablename__ = "registration_answers"

    __table_args__ = (
        UniqueConstraint(
            "registration_id",
            "field_id",
            name="uq_registration_answer_field",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    registration_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "event_registrations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    field_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "registration_fields.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    value: Mapped[dict | list | str | int | float | bool] = mapped_column(
        JSON,
        nullable=False,
    )


class Attendance(Base):
    __tablename__ = "event_attendance"

    __table_args__ = (
        UniqueConstraint(
            "registration_id",
            name="uq_attendance_registration",
        ),
        Index(
            "ix_event_attendance_registration_id",
            "registration_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    registration_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "event_registrations.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    checked_in_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
