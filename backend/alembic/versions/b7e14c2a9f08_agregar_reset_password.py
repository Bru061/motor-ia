"""agregar reset password

Revision ID: b7e14c2a9f08
Revises: f3a9c7d21e56
Create Date: 2026-08-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b7e14c2a9f08"
down_revision: Union[str, None] = "f3a9c7d21e56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column("reset_password_token_hash", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "usuarios",
        sa.Column(
            "reset_password_expires_at", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.create_index(
        op.f("ix_usuarios_reset_password_token_hash"),
        "usuarios",
        ["reset_password_token_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_usuarios_reset_password_token_hash"), table_name="usuarios"
    )
    op.drop_column("usuarios", "reset_password_expires_at")
    op.drop_column("usuarios", "reset_password_token_hash")
