"""Archive committees without removing event or certificate history."""
from alembic import op
import sqlalchemy as sa

revision = "round3_admin_management"
down_revision = "recovery_workflows"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "committees",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade():
    raise RuntimeError("Committee archive history is retained; destructive downgrade disabled.")
