from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.core.progreso_utils import calcular_porcentaje, obtener_estados_modulos
from app.db.session import get_db
from app.models.dependencia_modulo import DependenciaModulo
from app.models.modulo import Modulo
from app.models.progreso import Progreso
from app.models.recurso import Recurso
from app.models.recurso_progreso import RecursoProgreso
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario
from app.schemas.progreso import (
    ModuloConProgresoResponse,
    ProgresoEstadoRequest,
    ProgresoModuloResponse,
    ProgresoRecursoResponse,
    RecursoConProgresoResponse,
    ResumenProgresoResponse,
    RutaActivaConProgresoResponse,
)

router = APIRouter()


def _obtener_ruta_activa(
    db: Session,
    usuario_id: UUID,
) -> RutaAprendizaje:
    ruta = (
        db.query(RutaAprendizaje)
        .options(
            selectinload(RutaAprendizaje.modulos).selectinload(Modulo.recursos),
            selectinload(RutaAprendizaje.modulos).selectinload(Modulo.dependencias),
        )
        .filter(
            RutaAprendizaje.usuario_id == usuario_id,
            RutaAprendizaje.estado == "activa",
        )
        .order_by(
            RutaAprendizaje.created_at.desc(),
            RutaAprendizaje.id.desc(),
        )
        .first()
    )
    if ruta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene una ruta activa.",
        )
    return ruta


def _contar_recursos_completados(
    db: Session,
    usuario_id: UUID,
    recurso_ids: list[UUID],
) -> int:
    """Cuenta cuántos de los recursos dados están completados por el usuario."""
    if not recurso_ids:
        return 0
    return (
        db.query(func.count(func.distinct(RecursoProgreso.recurso_id)))
        .filter(
            RecursoProgreso.usuario_id == usuario_id,
            RecursoProgreso.recurso_id.in_(recurso_ids),
            RecursoProgreso.estado == "completado",
        )
        .scalar()
    )


def _construir_ruta_con_progreso(
    db: Session,
    ruta: RutaAprendizaje,
    usuario_id: UUID,
) -> RutaActivaConProgresoResponse:
    modulos = sorted(ruta.modulos, key=lambda modulo: modulo.orden)
    modulo_ids = [modulo.id for modulo in modulos]
    recurso_ids = [recurso.id for modulo in modulos for recurso in modulo.recursos]

    estados_modulos = obtener_estados_modulos(db, usuario_id, modulo_ids)
    estados_recursos = (
        dict(
            db.query(RecursoProgreso.recurso_id, RecursoProgreso.estado)
            .filter(
                RecursoProgreso.usuario_id == usuario_id,
                RecursoProgreso.recurso_id.in_(recurso_ids),
            )
            .all()
        )
        if recurso_ids
        else {}
    )

    return RutaActivaConProgresoResponse(
        id=ruta.id,
        usuario_id=ruta.usuario_id,
        titulo=ruta.titulo,
        estado=ruta.estado,
        desde_cache=bool(ruta.desde_cache),
        created_at=ruta.created_at,
        modulos=[
            ModuloConProgresoResponse(
                id=modulo.id,
                titulo=modulo.titulo,
                nivel=modulo.nivel,
                tiempo_estimado_hrs=modulo.tiempo_estimado_hrs,
                orden=modulo.orden,
                estado=estados_modulos.get(modulo.id, "pendiente"),
                actividad_practica=modulo.actividad_practica,
                recursos=[
                    RecursoConProgresoResponse(
                        id=recurso.id,
                        titulo=recurso.titulo,
                        tipo=recurso.tipo,
                        url=recurso.url,
                        estado=estados_recursos.get(recurso.id, "pendiente"),
                    )
                    for recurso in modulo.recursos
                ],
                dependencias=modulo.dependencias,
            )
            for modulo in modulos
        ],
    )


def _momento_completado(estado: str) -> datetime | None:
    return datetime.now(timezone.utc) if estado == "completado" else None


def _validar_prerequisitos(
    db: Session,
    usuario_id: UUID,
    modulo_id: UUID,
) -> None:
    """Verifica que todos los módulos de los que depende `modulo_id`
    ya estén marcados como completado por este usuario. Si falta alguno,
    lanza 400 con el título del primer módulo pendiente encontrado."""
    dependencias = (
        db.query(DependenciaModulo)
        .filter(DependenciaModulo.modulo_id == modulo_id)
        .all()
    )
    if not dependencias:
        return

    prerrequisito_ids = [dependencia.depende_de_id for dependencia in dependencias]

    completados = dict(
        db.query(Progreso.modulo_id, Progreso.estado)
        .filter(
            Progreso.usuario_id == usuario_id,
            Progreso.modulo_id.in_(prerrequisito_ids),
        )
        .all()
    )

    for dependencia in dependencias:
        if completados.get(dependencia.depende_de_id) != "completado":
            modulo_previo = (
                db.query(Modulo).filter(Modulo.id == dependencia.depende_de_id).first()
            )
            titulo_previo = (
                modulo_previo.titulo if modulo_previo else "el módulo anterior"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Debes completar primero el módulo «{titulo_previo}» antes "
                    "de avanzar en este."
                ),
            )


def _guardar_progreso(
    db: Session,
    progreso: Progreso | RecursoProgreso,
) -> Progreso | RecursoProgreso:
    try:
        db.commit()
        db.refresh(progreso)
        return progreso
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el progreso.",
        ) from exc


@router.get(
    "/ruta-activa",
    response_model=RutaActivaConProgresoResponse,
)
def obtener_ruta_activa(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ruta = _obtener_ruta_activa(db, current_user.id)
    return _construir_ruta_con_progreso(db, ruta, current_user.id)


@router.patch(
    "/modulos/{modulo_id}",
    response_model=ProgresoModuloResponse,
)
def actualizar_progreso_modulo(
    modulo_id: UUID,
    request: ProgresoEstadoRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ruta = _obtener_ruta_activa(db, current_user.id)
    modulo = (
        db.query(Modulo)
        .filter(
            Modulo.id == modulo_id,
            Modulo.ruta_id == ruta.id,
        )
        .first()
    )
    if modulo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El módulo no pertenece a la ruta activa del usuario.",
        )

    progreso = (
        db.query(Progreso)
        .filter(
            Progreso.usuario_id == current_user.id,
            Progreso.modulo_id == modulo_id,
        )
        .first()
    )

    if (
        progreso is not None
        and progreso.estado == "completado"
        and request.estado != "completado"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este módulo ya fue completado y no puede regresar a un estado anterior.",
        )

    if progreso is None:
        progreso = Progreso(
            usuario_id=current_user.id,
            modulo_id=modulo_id,
        )
        db.add(progreso)
    if request.estado in ("en_progreso", "completado"):
        _validar_prerequisitos(db, current_user.id, modulo_id)

    progreso.estado = request.estado
    progreso.completado_at = _momento_completado(request.estado)
    return _guardar_progreso(db, progreso)


@router.patch(
    "/recursos/{recurso_id}",
    response_model=ProgresoRecursoResponse,
)
def actualizar_progreso_recurso(
    recurso_id: UUID,
    request: ProgresoEstadoRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ruta = _obtener_ruta_activa(db, current_user.id)
    recurso = (
        db.query(Recurso)
        .join(Modulo, Recurso.modulo_id == Modulo.id)
        .filter(
            Recurso.id == recurso_id,
            Modulo.ruta_id == ruta.id,
        )
        .first()
    )
    if recurso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El recurso no pertenece a la ruta activa del usuario.",
        )
    if request.estado == "completado":
        _validar_prerequisitos(db, current_user.id, recurso.modulo_id)

    progreso = (
        db.query(RecursoProgreso)
        .filter(
            RecursoProgreso.usuario_id == current_user.id,
            RecursoProgreso.recurso_id == recurso_id,
        )
        .first()
    )
    if progreso is None:
        progreso = RecursoProgreso(
            usuario_id=current_user.id,
            recurso_id=recurso_id,
        )
        db.add(progreso)

    progreso.estado = request.estado
    progreso.completado_at = _momento_completado(request.estado)
    progreso.visto = request.estado == "completado"
    progreso.visto_at = progreso.completado_at
    progreso_recurso = _guardar_progreso(db, progreso)

    if request.estado == "completado":
        recursos_del_modulo_ids = [
            fila_recurso_id
            for (fila_recurso_id,) in db.query(Recurso.id).filter(
                Recurso.modulo_id == recurso.modulo_id
            )
        ]
        total_recursos_modulo = len(recursos_del_modulo_ids)
        recursos_vistos_modulo = _contar_recursos_completados(
            db, current_user.id, recursos_del_modulo_ids
        )
        todos_los_recursos_vistos = (
            total_recursos_modulo > 0
            and recursos_vistos_modulo == total_recursos_modulo
        )
        nuevo_estado_modulo = (
            "completado" if todos_los_recursos_vistos else "en_progreso"
        )

        progreso_modulo = (
            db.query(Progreso)
            .filter(
                Progreso.usuario_id == current_user.id,
                Progreso.modulo_id == recurso.modulo_id,
            )
            .first()
        )
        if progreso_modulo is None:
            db.add(
                Progreso(
                    usuario_id=current_user.id,
                    modulo_id=recurso.modulo_id,
                    estado=nuevo_estado_modulo,
                    completado_at=_momento_completado(nuevo_estado_modulo),
                )
            )
            db.commit()
        elif progreso_modulo.estado != "completado" and (
            progreso_modulo.estado == "pendiente" or todos_los_recursos_vistos
        ):
            progreso_modulo.estado = nuevo_estado_modulo
            progreso_modulo.completado_at = _momento_completado(nuevo_estado_modulo)
            db.commit()

    return progreso_recurso


@router.get("/resumen", response_model=ResumenProgresoResponse)
def obtener_resumen_progreso(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ruta = _obtener_ruta_activa(db, current_user.id)
    modulo_ids = [modulo.id for modulo in ruta.modulos]
    recurso_ids = [recurso.id for modulo in ruta.modulos for recurso in modulo.recursos]

    estados_modulos = obtener_estados_modulos(db, current_user.id, modulo_ids)
    modulos_completados = sum(
        estado == "completado" for estado in estados_modulos.values()
    )
    modulos_en_progreso = sum(
        estado == "en_progreso" for estado in estados_modulos.values()
    )
    recursos_completados = _contar_recursos_completados(
        db, current_user.id, recurso_ids
    )
    total_modulos = len(modulo_ids)
    total_recursos = len(recurso_ids)
    modulos_pendientes = total_modulos - modulos_completados - modulos_en_progreso
    total_elementos = total_modulos + total_recursos
    total_completados = modulos_completados + recursos_completados
    porcentaje_avance = calcular_porcentaje(modulos_completados, total_modulos)

    return ResumenProgresoResponse(
        total_modulos=total_modulos,
        modulos_completados=modulos_completados,
        modulos_pendientes=modulos_pendientes,
        modulos_en_progreso=modulos_en_progreso,
        porcentaje_avance=porcentaje_avance,
        total_recursos=total_recursos,
        recursos_completados=recursos_completados,
        porcentaje_modulos=porcentaje_avance,
        porcentaje_recursos=calcular_porcentaje(recursos_completados, total_recursos),
        porcentaje_general=calcular_porcentaje(total_completados, total_elementos),
    )
