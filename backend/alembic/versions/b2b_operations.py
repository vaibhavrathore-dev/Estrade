"""Add operational records without modifying any existing table or constraint."""
from alembic import op
import sqlalchemy as sa
revision = 'b2b_operations'
down_revision = '64f6563d3960'
branch_labels = None
depends_on = None

def identity():
    return sa.Column('id', sa.Uuid(), primary_key=True)

def fk(name, target, nullable=False):
    return sa.Column(name, sa.Uuid(), sa.ForeignKey(target), nullable=nullable)

def created():
    return sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)

def upgrade():
    op.create_table('event_assignments', identity(), fk('event_id', 'events.id'), fk('user_id', 'users.id'),
        fk('assigned_by', 'users.id'), sa.Column('duty', sa.String(150), nullable=False),
        sa.Column('status', sa.String(20), nullable=False), created(),
        sa.CheckConstraint("status IN ('active','withdrawn')", name='ck_assignment_status'))
    op.create_index('ix_event_assignments_event_id', 'event_assignments', ['event_id'])
    op.create_index('uq_active_assignment', 'event_assignments', ['event_id', 'user_id'], unique=True,
        postgresql_where=sa.text("status = 'active'"))
    op.create_table('withdrawal_requests', identity(), fk('assignment_id', 'event_assignments.id'),
        sa.Column('reason', sa.Text(), nullable=False), sa.Column('status', sa.String(20), nullable=False),
        fk('reviewed_by', 'users.id', True), sa.Column('reviewed_at', sa.DateTime(timezone=True)), created(),
        sa.CheckConstraint("status IN ('pending','approved','rejected')", name='ck_withdrawal_status'))
    op.create_index('uq_pending_withdrawal', 'withdrawal_requests', ['assignment_id'], unique=True,
        postgresql_where=sa.text("status = 'pending'"))
    op.create_table('event_participations', identity(), fk('event_id', 'events.id'), fk('user_id', 'users.id'),
        fk('verified_by', 'users.id'), sa.Column('evidence', sa.Text(), nullable=False), created(),
        sa.UniqueConstraint('event_id','user_id', name='uq_participation'))
    op.create_table('certificates', identity(), fk('participation_id', 'event_participations.id'),
        sa.Column('certificate_type', sa.String(30), nullable=False), fk('issued_by', 'users.id'),
        sa.Column('participant_name', sa.String(150), nullable=False), sa.Column('event_title', sa.String(200), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False), created(),
        sa.UniqueConstraint('participation_id', 'certificate_type', name='uq_certificate_issuance'),
        sa.CheckConstraint("certificate_type = 'participation'", name='ck_certificate_type'))
    op.create_table('media_analyses', identity(), fk('event_id', 'events.id'), fk('uploaded_by', 'users.id'),
        sa.Column('result', sa.JSON(), nullable=False), created())
    op.create_index('ix_media_analyses_event_id', 'media_analyses', ['event_id'])

def downgrade():
    raise RuntimeError('Operational history is retained; automatic destructive downgrade is disabled.')
