"""Helpers de progreso compartidos entre los endpoints de progreso y admin.

Evita duplicar la misma lógica de cálculo de porcentaje y de consulta de
estados de módulos en `progreso.py` y `admin.py`.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.progreso import Progreso

# Valores posibles del campo `estado` en Progreso/RecursoProgreso.
# Ver tambien app.schemas.progreso.EstadoProgreso (el Literal usado para
# validar el request/response); estas constantes son para comparar contra
# ese mismo valor en la logica interna sin repetir el string literal.
ESTADO_PENDIENTE = "pendiente"
ESTADO_EN_PROGRESO = "en_progreso"
ESTADO_COMPLETADO = "completado"


def calcular_porcentaje(completados: int, total: int) -> float:
    """Redondea el porcentaje completados/total a 2 decimales (0 si total es 0)."""
    return round(completados * 100 / total, 2) if total else 0.0


def obtener_estados_modulos(
    db: Session,
    usuario_id: UUID,
    modulo_ids: list[UUID],
) -> dict[UUID, str]:
    """Mapa {modulo_id: estado} del progreso del usuario en esos módulos."""
    if not modulo_ids:
        return {}
    return dict(
        db.query(Progreso.modulo_id, Progreso.estado)
        .filter(
            Progreso.usuario_id == usuario_id,
            Progreso.modulo_id.in_(modulo_ids),
        )
        .all()
    )
