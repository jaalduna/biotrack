"""merge heads before adding diagnostic categories

Revision ID: merge_before_diagnostic_categories
Revises: 25f33dd1fe45, antibiotics_add
Create Date: 2026-01-05 01:15:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "merge_before_diagnostic_categories"
down_revision = ("25f33dd1fe45", "antibiotics_add")
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
