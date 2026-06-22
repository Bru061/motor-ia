from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.db.session import get_db
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
            selectinload(RutaAprendizaje.modulos).selectinload(Modulo.recursos)
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


def _construir_ruta_con_progreso(
    db: Session,
    ruta: RutaAprendizaje,
    usuario_id: UUID,
) -> RutaActivaConProgresoResponse:
    modulos = sorted(ruta.modulos, key=lambda modulo: modulo.orden)
    modulo_ids = [modulo.id for modulo in modulos]
    recurso_ids = [
        recurso.id for modulo in modulos for recurso in modulo.recursos
    ]

    estados_modulos = (
        dict(
            db.query(Progreso.modulo_id, Progreso.estado)
            .filter(
                Progreso.usuario_id == usuario_id,
                Progreso.modulo_id.in_(modulo_ids),
            )
            .all()
        )
        if modulo_ids
        else {}
    )
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
            )
            for modulo in modulos
        ],
    )


def _momento_completado(estado: str) -> datetime | None:
    return datetime.now(timezone.utc) if estado == "completado" else None


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
    if progreso is None:
        progreso = Progreso(
            usuario_id=current_user.id,
            modulo_id=modulo_id,
        )
        db.add(progreso)

    progreso.estado = request.estado
    progreso.completado_at = _momento_completado(request.estado)
    db.commit()
    db.refresh(progreso)
    return progreso


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
    db.commit()
    db.refresh(progreso)
    return progreso


def _porcentaje(completados: int, total: int) -> float:
    return round(completados * 100 / total, 2) if total else 0.0


@router.get("/resumen", response_model=ResumenProgresoResponse)
def obtener_resumen_progreso(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ruta = _obtener_ruta_activa(db, current_user.id)
    modulo_ids = [modulo.id for modulo in ruta.modulos]
    recurso_ids = [
        recurso.id for modulo in ruta.modulos for recurso in modulo.recursos
    ]

    modulos_completados = (
        db.query(func.count(func.distinct(Progreso.modulo_id)))
        .filter(
            Progreso.usuario_id == current_user.id,
            Progreso.modulo_id.in_(modulo_ids),
            Progreso.estado == "completado",
        )
        .scalar()
        if modulo_ids
        else 0
    )
    recursos_completados = (
        db.query(func.count(func.distinct(RecursoProgreso.recurso_id)))
        .filter(
            RecursoProgreso.usuario_id == current_user.id,
            RecursoProgreso.recurso_id.in_(recurso_ids),
            RecursoProgreso.estado == "completado",
        )
        .scalar()
        if recurso_ids
        else 0
    )
    total_modulos = len(modulo_ids)
    total_recursos = len(recurso_ids)
    total_elementos = total_modulos + total_recursos
    total_completados = modulos_completados + recursos_completados

    return ResumenProgresoResponse(
        total_modulos=total_modulos,
        modulos_completados=modulos_completados,
        total_recursos=total_recursos,
        recursos_completados=recursos_completados,
        porcentaje_modulos=_porcentaje(modulos_completados, total_modulos),
        porcentaje_recursos=_porcentaje(recursos_completados, total_recursos),
        porcentaje_general=_porcentaje(total_completados, total_elementos),
    )
