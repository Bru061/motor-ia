"""corregir timezone columnas progreso

Revision ID: <REVISION_GENERADA>
Revises: a1c3f0e29d41
Create Date: 2026-08-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "<REVISION_GENERADA>"
down_revision: Union[str, None] = "a1c3f0e29d41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "progreso",
        "updated_at",
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        postgresql_using="updated_at AT TIME ZONE 'America/Mexico_City'",
    )

    op.alter_column(
        "recursos_progreso",
        "updated_at",
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        postgresql_using="updated_at AT TIME ZONE 'America/Mexico_City'",
    )

    op.alter_column(
        "recursos_progreso",
        "completado_at",
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        postgresql_using="completado_at AT TIME ZONE 'America/Mexico_City'",
    )


def downgrade() -> None:
    op.alter_column(
        "progreso",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        postgresql_using="updated_at AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        "recursos_progreso",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        postgresql_using="updated_at AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        "recursos_progreso",
        "completado_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        postgresql_using="completado_at AT TIME ZONE 'UTC'",
    )