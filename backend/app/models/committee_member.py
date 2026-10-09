import uuid
from datetime import datetime

from sqlalchemy import (
    Uuid,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    func,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CommitteeMember(Base):
    __tablename__ = "committee_members"

    __table_args__ = (
        UniqueConstraint(
            "committee_id",
            "user_id",
            name="uq_committee_user",
        ),
        CheckConstraint(
            "committee_role IN ('head', 'executive', 'coordinator', 'member')",
            name="valid_committee_role",
        ),
        CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name="valid_verification_status",
        ),
        CheckConstraint(
            "verification_status != 'approved' OR "
            "(verified_by IS NOT NULL AND verified_at IS NOT NULL)",
            name="approved_requires_verifier",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    committee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("committees.id", ondelete="RESTRICT"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    committee_role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    verification_status: Mapped[str] = mapped_column(
        String(20),
        server_default="pending",
        nullable=False,
    )

    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    committee: Mapped["Committee"] = relationship(
        "Committee",
        back_populates="memberships",
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )

    verifier: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[verified_by],
    )
