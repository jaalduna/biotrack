"""increase subcategory name length

Revision ID: f2d7b7f26a90
Revises: add_diagnostic_categories
Create Date: 2026-01-05 00:45:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "f2d7b7f26a90"
down_revision = "add_diagnostic_categories"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "diagnostic_subcategories",
        "name",
        type_=sa.String(length=300),
        existing_type=sa.String(length=100),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        "diagnostic_subcategories",
        "name",
        type_=sa.String(length=100),
        existing_type=sa.String(length=300),
        existing_nullable=False,
    )
