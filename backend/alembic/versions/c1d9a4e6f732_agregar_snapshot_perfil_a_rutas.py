"""agregar snapshot de perfil a rutas de aprendizaje

Revision ID: c1d9a4e6f732
Revises: b7e14c2a9f08
Create Date: 2026-08-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c1d9a4e6f732"
down_revision: Union[str, None] = "b7e14c2a9f08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rutas_aprendizaje",
        sa.Column("nivel_actual", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "rutas_aprendizaje",
        sa.Column("tecnologias_nombres", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("rutas_aprendizaje", "tecnologias_nombres")
    op.drop_column("rutas_aprendizaje", "nivel_actual")
