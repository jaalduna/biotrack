"""add_email_verification_and_invitation_acceptance

Revision ID: 25f33dd1fe45
Revises: 62e9fafd99f7
Create Date: 2025-12-15 04:01:36.021799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '25f33dd1fe45'
down_revision: Union[str, None] = '62e9fafd99f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email verification columns to users table
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verification_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verification_expires', sa.TIMESTAMP(), nullable=True))
    
    # Add invitation acceptance tracking to team_invitations table
    op.add_column('team_invitations', sa.Column('accepted_at', sa.TIMESTAMP(), nullable=True))
    op.add_column('team_invitations', sa.Column('accepted_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_invitation_accepted_by', 'team_invitations', 'users', ['accepted_by'], ['id'])


def downgrade() -> None:
    # Remove foreign key first
    op.drop_constraint('fk_invitation_accepted_by', 'team_invitations', type_='foreignkey')
    
    # Remove columns from team_invitations
    op.drop_column('team_invitations', 'accepted_by')
    op.drop_column('team_invitations', 'accepted_at')
    
    # Remove columns from users
    op.drop_column('users', 'email_verification_expires')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'email_verified')
