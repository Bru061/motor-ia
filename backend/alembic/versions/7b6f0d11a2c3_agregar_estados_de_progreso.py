"""agregar estados de progreso

Revision ID: 7b6f0d11a2c3
Revises: dc6804864ff7
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "7b6f0d11a2c3"
down_revision: Union[str, None] = "dc6804864ff7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columnas = {
        c["name"] for c in inspector.get_columns("recursos_progreso")
    }

    if "estado" not in columnas:
        op.add_column(
            "recursos_progreso",
            sa.Column(
                "estado",
                sa.String(length=20),
                server_default="pendiente",
                nullable=False,
            ),
        )

    if "completado_at" not in columnas:
        op.add_column(
            "recursos_progreso",
            sa.Column(
                "completado_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )

    if "updated_at" not in columnas:
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
        SET estado = CASE
            WHEN visto THEN 'completado'
            ELSE 'pendiente'
        END,
        completado_at = CASE
            WHEN visto THEN visto_at
            ELSE NULL
        END
        """
    )

    existentes = {
        c["name"] for c in inspector.get_unique_constraints("progreso")
    }

    if "uq_progreso_usuario_modulo" not in existentes:
        op.create_unique_constraint(
            "uq_progreso_usuario_modulo",
            "progreso",
            ["usuario_id", "modulo_id"],
        )

    existentes = {
        c["name"] for c in inspector.get_unique_constraints("recursos_progreso")
    }

    if "uq_recurso_progreso_usuario_recurso" not in existentes:
        op.create_unique_constraint(
            "uq_recurso_progreso_usuario_recurso",
            "recursos_progreso",
            ["usuario_id", "recurso_id"],
        )

    checks = {
        c["name"] for c in inspector.get_check_constraints("progreso")
    }

    if "ck_progreso_estado_valido" not in checks:
        op.create_check_constraint(
            "ck_progreso_estado_valido",
            "progreso",
            "estado IN ('pendiente', 'en_progreso', 'completado')",
        )

    checks = {
        c["name"] for c in inspector.get_check_constraints("recursos_progreso")
    }

    if "ck_recurso_progreso_estado_valido" not in checks:
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
