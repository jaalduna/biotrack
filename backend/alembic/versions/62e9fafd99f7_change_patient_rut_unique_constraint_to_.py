"""change_patient_rut_unique_constraint_to_per_team

Revision ID: 62e9fafd99f7
Revises: 3edbc464404d
Create Date: 2025-12-14 02:26:16.742861

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62e9fafd99f7'
down_revision: Union[str, None] = '3edbc464404d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old unique constraint on rut column
    op.drop_constraint('patients_rut_key', 'patients', type_='unique')
    
    # Add new compound unique constraint for (rut, team_id)
    op.create_unique_constraint('uq_patient_rut_team', 'patients', ['rut', 'team_id'])


def downgrade() -> None:
    # Remove the compound unique constraint
    op.drop_constraint('uq_patient_rut_team', 'patients', type_='unique')
    
    # Restore the old unique constraint on rut
    op.create_unique_constraint('patients_rut_key', 'patients', ['rut'])
