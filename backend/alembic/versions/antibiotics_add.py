"""Add antibiotics table

Revision ID: antibiotics_add
Revises: 295b25cb45c8
Create Date: 2025-01-04 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "antibiotics_add"
down_revision = "295b25cb45c8"
branch_labels = None
depends_on = None


def upgrade():
    # Create antibiotics table
    op.create_table(
        "antibiotics",
        sa.Column("id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("default_start_count", sa.Integer(), nullable=False, default=0),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_antibiotics_name"), "antibiotics", ["name"], unique=True)


def downgrade():
    op.drop_index(op.f("ix_antibiotics_name"), table_name="antibiotics")
    op.drop_table("antibiotics")
