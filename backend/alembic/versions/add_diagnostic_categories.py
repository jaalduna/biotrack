"""add diagnostic categories

Revision ID: add_diagnostic_categories
Revises: merge_before_diagnostic_categories
Create Date: 2026-01-05 01:16:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "add_diagnostic_categories"
down_revision = "merge_before_diagnostic_categories"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "diagnostic_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column(
            "sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False
        ),
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
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "diagnostic_subcategories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column(
            "sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False
        ),
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
        sa.ForeignKeyConstraint(
            ["category_id"], ["diagnostic_categories.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column(
        "diagnostics",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "diagnostics",
        sa.Column("subcategory_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_diagnostics_category_id",
        "diagnostics",
        "diagnostic_categories",
        ["category_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_diagnostics_subcategory_id",
        "diagnostics",
        "diagnostic_subcategories",
        ["subcategory_id"],
        ["id"],
    )


def downgrade():
    op.drop_constraint(
        "fk_diagnostics_subcategory_id", "diagnostics", type_="foreignkey"
    )
    op.drop_constraint("fk_diagnostics_category_id", "diagnostics", type_="foreignkey")
    op.drop_column("diagnostics", "subcategory_id")
    op.drop_column("diagnostics", "category_id")
    op.drop_table("diagnostic_subcategories")
    op.drop_table("diagnostic_categories")
