"""agregar autenticacion google

Revision ID: f3a9c7d21e56
Revises: <REVISION_GENERADA>
Create Date: 2026-08-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f3a9c7d21e56"
down_revision: Union[str, None] = "<REVISION_GENERADA>"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column("google_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "usuarios",
        sa.Column(
            "auth_provider",
            sa.String(length=20),
            nullable=False,
            server_default="local",
        ),
    )
    op.create_unique_constraint(
        "uq_usuarios_google_id", "usuarios", ["google_id"]
    )
    op.create_index(
        op.f("ix_usuarios_google_id"), "usuarios", ["google_id"], unique=False
    )
    op.alter_column(
        "usuarios",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "usuarios",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.drop_index(op.f("ix_usuarios_google_id"), table_name="usuarios")
    op.drop_constraint("uq_usuarios_google_id", "usuarios", type_="unique")
    op.drop_column("usuarios", "auth_provider")
    op.drop_column("usuarios", "google_id")
