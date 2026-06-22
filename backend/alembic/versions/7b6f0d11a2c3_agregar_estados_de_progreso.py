"""agregar estados de progreso

Revision ID: 7b6f0d11a2c3
Revises: dc6804864ff7
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7b6f0d11a2c3"
down_revision: Union[str, None] = "dc6804864ff7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "recursos_progreso",
        sa.Column(
            "estado",
            sa.String(length=20),
            server_default="pendiente",
            nullable=False,
        ),
    )
    op.add_column(
        "recursos_progreso",
        sa.Column("completado_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "recursos_progreso",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE recursos_progreso
        SET estado = CASE WHEN visto THEN 'completado' ELSE 'pendiente' END,
            completado_at = CASE WHEN visto THEN visto_at ELSE NULL END
        """
    )

    op.create_unique_constraint(
        "uq_progreso_usuario_modulo",
        "progreso",
        ["usuario_id", "modulo_id"],
    )
    op.create_unique_constraint(
        "uq_recurso_progreso_usuario_recurso",
        "recursos_progreso",
        ["usuario_id", "recurso_id"],
    )
    op.create_check_constraint(
        "ck_progreso_estado_valido",
        "progreso",
        "estado IN ('pendiente', 'en_progreso', 'completado')",
    )
    op.create_check_constraint(
        "ck_recurso_progreso_estado_valido",
        "recursos_progreso",
        "estado IN ('pendiente', 'en_progreso', 'completado')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_recurso_progreso_estado_valido",
        "recursos_progreso",
        type_="check",
    )
    op.drop_constraint(
        "ck_progreso_estado_valido",
        "progreso",
        type_="check",
    )
    op.drop_constraint(
        "uq_recurso_progreso_usuario_recurso",
        "recursos_progreso",
        type_="unique",
    )
    op.drop_constraint(
        "uq_progreso_usuario_modulo",
        "progreso",
        type_="unique",
    )
    op.drop_column("recursos_progreso", "updated_at")
    op.drop_column("recursos_progreso", "completado_at")
    op.drop_column("recursos_progreso", "estado")
