import uuid
from datetime import datetime
from sqlalchemy import Uuid, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, Index, Text, JSON, func, text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Assignment(Base):
    __tablename__ = 'event_assignments'
    __table_args__ = (
        CheckConstraint("status IN ('active','withdrawn')", name='ck_assignment_status'),
        Index('uq_active_assignment', 'event_id', 'user_id', unique=True, postgresql_where=text("status = 'active'")),
    )
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('events.id'), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    assigned_by: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    duty: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(20), default='active')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Withdrawal(Base):
    __tablename__ = 'withdrawal_requests'
    __table_args__ = (CheckConstraint("status IN ('pending','approved','rejected')", name='ck_withdrawal_status'),
        Index('uq_pending_withdrawal', 'assignment_id', unique=True, postgresql_where=text("status = 'pending'")),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('event_assignments.id'))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default='pending')
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('users.id'))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Participation(Base):
    __tablename__ = 'event_participations'
    __table_args__ = (UniqueConstraint('event_id', 'user_id', name='uq_participation'),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('events.id'))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    verified_by: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    evidence: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Certificate(Base):
    __tablename__ = 'certificates'
    __table_args__ = (UniqueConstraint('participation_id', 'certificate_type', name='uq_certificate_issuance'),
        CheckConstraint("certificate_type = 'participation'", name='ck_certificate_type'))
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    participation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('event_participations.id'))
    certificate_type: Mapped[str] = mapped_column(String(30), default='participation')
    issued_by: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    participant_name: Mapped[str] = mapped_column(String(150))
    event_title: Mapped[str] = mapped_column(String(200))
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class MediaAnalysis(Base):
    __tablename__ = 'media_analyses'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('events.id'), index=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'))
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
