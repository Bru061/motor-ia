"""seed categorias tecnologia

Revision ID: 0e75b96b36c1
Revises: c1d9a4e6f732
Create Date: 2026-08-06 10:25:25.095008

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e75b96b36c1'
down_revision: Union[str, None] = 'c1d9a4e6f732'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CATEGORIAS = [
    {
        "nombre": "Frontend",
        "descripcion": "Desarrollo de interfaces de usuario: HTML, CSS, JavaScript, React, Vue, Angular",
    },
    {
        "nombre": "Backend",
        "descripcion": "Desarrollo del servidor y lógica de negocio: Python, Node.js, Java, FastAPI, Django",
    },
    {
        "nombre": "Base de datos",
        "descripcion": "Gestión y modelado de datos: PostgreSQL, MySQL, MongoDB, Redis, SQLAlchemy",
    },
    {
        "nombre": "DevOps",
        "descripcion": "Infraestructura y despliegue: Docker, Kubernetes, CI/CD, AWS, Railway, Vercel",
    },
    {
        "nombre": "Data Science",
        "descripcion": "Análisis de datos e inteligencia artificial: Python, Pandas, NumPy, Machine Learning",
    },
    {
        "nombre": "Mobile",
        "descripcion": "Desarrollo de aplicaciones móviles: React Native, Flutter, Swift, Kotlin",
    },
    {
        "nombre": "Seguridad",
        "descripcion": "Ciberseguridad y buenas prácticas: autenticación, autorización, OWASP, JWT",
    },
    {
        "nombre": "Control de versiones",
        "descripcion": "Gestión del código fuente: Git, GitHub, GitLab, estrategias de branching",
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    for cat in CATEGORIAS:
        conn.execute(
            sa.text(
                """
                INSERT INTO categorias_tecnologia (id, nombre, descripcion)
                VALUES (:id, :nombre, :descripcion)
                ON CONFLICT (nombre) DO NOTHING
                """
            ),
            {"id": str(uuid.uuid4()), "nombre": cat["nombre"], "descripcion": cat["descripcion"]},
        )


def downgrade() -> None:
    conn = op.get_bind()
    nombres = [c["nombre"] for c in CATEGORIAS]
    conn.execute(
        sa.text("DELETE FROM categorias_tecnologia WHERE nombre = ANY(:nombres)"),
        {"nombres": nombres},
    )