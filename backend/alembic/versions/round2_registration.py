"""Add event registration and attendance."""

from alembic import op
import sqlalchemy as sa


revision = "round2_registration"
down_revision = "b2b_operations"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "event_id",
            sa.Uuid(),
            sa.ForeignKey("events.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "certificate_name",
            sa.String(150),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="registered",
        ),
        sa.Column(
            "registered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "event_id",
            "user_id",
            name="uq_event_registration_user",
        ),
        sa.CheckConstraint(
            "status IN ('registered','cancelled')",
            name="ck_event_registration_status",
        ),
    )

    op.create_index(
        "ix_event_registrations_event_id",
        "event_registrations",
        ["event_id"],
    )

    op.create_table(
        "registration_fields",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "event_id",
            sa.Uuid(),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "label",
            sa.String(120),
            nullable=False,
        ),
        sa.Column(
            "field_type",
            sa.String(30),
            nullable=False,
            server_default="text",
        ),
        sa.Column(
            "required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "options",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "position",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "event_id",
            "label",
            name="uq_registration_field_event_label",
        ),
        sa.CheckConstraint(
            "field_type IN "
            "('text','number','select','multiselect','boolean','url','phone')",
            name="ck_registration_field_type",
        ),
    )

    op.create_index(
        "ix_registration_fields_event_id",
        "registration_fields",
        ["event_id"],
    )

    op.create_table(
        "registration_answers",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "registration_id",
            sa.Uuid(),
            sa.ForeignKey(
                "event_registrations.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "field_id",
            sa.Uuid(),
            sa.ForeignKey(
                "registration_fields.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "value",
            sa.JSON(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "registration_id",
            "field_id",
            name="uq_registration_answer_field",
        ),
    )

    op.create_table(
        "event_attendance",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "registration_id",
            sa.Uuid(),
            sa.ForeignKey(
                "event_registrations.id",
                ondelete="RESTRICT",
            ),
            nullable=False,
        ),
        sa.Column(
            "checked_in_by",
            sa.Uuid(),
            sa.ForeignKey(
                "users.id",
                ondelete="RESTRICT",
            ),
            nullable=False,
        ),
        sa.Column(
            "checked_in_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "registration_id",
            name="uq_attendance_registration",
        ),
    )

    op.create_index(
        "ix_event_attendance_registration_id",
        "event_attendance",
        ["registration_id"],
    )


def downgrade():
    raise RuntimeError(
        "Automatic destructive downgrade disabled."
    )
