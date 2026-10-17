"""Add membership request reasons and expiring email challenges; preserve existing users."""
from alembic import op
import sqlalchemy as sa
revision = 'recovery_workflows'
down_revision = 'round2_certificate_engine'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('committee_members', sa.Column('request_reason', sa.String(2000), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_table('email_challenges',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('purpose', sa.String(20), nullable=False),
        sa.Column('code_hash', sa.String(64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('window_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('requests', sa.Integer(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.Column('verified', sa.Boolean(), nullable=False),
        sa.Column('consumed', sa.Boolean(), nullable=False),
        sa.UniqueConstraint('email','purpose', name='uq_email_challenge_purpose'))

def downgrade():
    raise RuntimeError('Destructive downgrade disabled')
