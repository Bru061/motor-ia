"""agregar actividad_practica a modulos

Revision ID: a1c3f0e29d41
Revises: 7b6f0d11a2c3
Create Date: 2026-08-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1c3f0e29d41"
down_revision: Union[str, None] = "7b6f0d11a2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "modulos",
        sa.Column("actividad_practica", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("modulos", "actividad_practica")