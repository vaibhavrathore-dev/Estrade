import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Boolean, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class EmailChallenge(Base):
    __tablename__ = 'email_challenges'
    __table_args__ = (UniqueConstraint('email', 'purpose', name='uq_email_challenge_purpose'),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(String(20))
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    window_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    requests: Mapped[int] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False)
