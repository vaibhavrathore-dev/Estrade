"""Upgrade certificates for branded verification and delivery."""

from alembic import op
import sqlalchemy as sa


revision = "round2_certificate_engine"
down_revision = "round2_registration"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "certificates",
        sa.Column("college_name", sa.String(200), nullable=True),
    )

    op.add_column(
        "certificates",
        sa.Column("department_name", sa.String(200), nullable=True),
    )

    op.add_column(
        "certificates",
        sa.Column("signatory_name", sa.String(150), nullable=True),
    )

    op.add_column(
        "certificates",
        sa.Column("verification_code", sa.String(80), nullable=True),
    )

    op.add_column(
        "certificates",
        sa.Column("file_hash_sha256", sa.String(64), nullable=True),
    )

    op.add_column(
        "certificates",
        sa.Column(
            "delivery_status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "certificates",
        sa.Column(
            "emailed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_unique_constraint(
        "uq_certificate_verification_code",
        "certificates",
        ["verification_code"],
    )

    op.create_check_constraint(
        "ck_certificate_delivery_status",
        "certificates",
        "delivery_status IN ('pending','sent','failed')",
    )


def downgrade():
    raise RuntimeError(
        "Certificate issuance history is retained; destructive downgrade disabled."
    )
