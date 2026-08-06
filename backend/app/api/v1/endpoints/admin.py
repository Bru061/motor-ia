from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_admin_user
from app.core.progreso_utils import calcular_porcentaje, obtener_estados_modulos
from app.db.session import get_db
from app.models.modulo import Modulo
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.models.progreso import Progreso
from app.models.recurso_progreso import RecursoProgreso
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario
from app.schemas.admin import (
    AdminModuloRutaResponse,
    AdminPerfilUsuarioResponse,
    AdminProgresoResumenResponse,
    AdminRutaActivaResponse,
    AdminRutaHistorialResponse,
    AdminTecnologiaUsuarioResponse,
    AdminUsuarioDetalleResponse,
    AdminUsuarioListItem,
    AdminUsuariosListResponse,
)

router = APIRouter()


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/usuarios", response_model=AdminUsuariosListResponse)
def listar_usuarios(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=255),
    meta_profesional: str | None = Query(default=None, max_length=255),
    _: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> AdminUsuariosListResponse:
    tiene_perfil = (
        db.query(PerfilUsuario.id)
        .filter(PerfilUsuario.usuario_id == Usuario.id)
        .exists()
    )
    tiene_ruta_activa = (
        db.query(RutaAprendizaje.id)
        .filter(
            RutaAprendizaje.usuario_id == Usuario.id,
            RutaAprendizaje.estado == "activa",
        )
        .exists()
    )
    meta_profesional_subquery = (
        db.query(PerfilUsuario.meta_profesional)
        .filter(PerfilUsuario.usuario_id == Usuario.id)
        .limit(1)
        .scalar_subquery()
    )
    query = db.query(
        Usuario,
        tiene_perfil.label("tiene_perfil"),
        tiene_ruta_activa.label("tiene_ruta_activa"),
        meta_profesional_subquery.label("meta_profesional"),
    )

    if search and (term := search.strip()):
        pattern = f"%{_escape_like(term)}%"
        query = query.filter(
            or_(
                Usuario.nombre.ilike(pattern, escape="\\"),
                Usuario.email.ilike(pattern, escape="\\"),
            )
        )

    if meta_profesional and (meta_term := meta_profesional.strip()):
        meta_pattern = f"%{_escape_like(meta_term)}%"
        query = query.filter(
            db.query(PerfilUsuario.id)
            .filter(
                PerfilUsuario.usuario_id == Usuario.id,
                PerfilUsuario.meta_profesional.ilike(meta_pattern, escape="\\"),
            )
            .exists()
        )

    total = query.count()
    rows = (
        query.order_by(Usuario.created_at.desc(), Usuario.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return AdminUsuariosListResponse(
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        usuarios=[
            AdminUsuarioListItem(
                id=usuario.id,
                email=usuario.email,
                nombre=usuario.nombre,
                rol=usuario.rol,
                meta_profesional=meta_profesional,
                created_at=usuario.created_at,
                tiene_perfil=bool(perfil),
                tiene_ruta_activa=bool(ruta_activa),
            )
            for usuario, perfil, ruta_activa, meta_profesional in rows
        ],
    )


@router.get(
    "/usuarios/{usuario_id}",
    response_model=AdminUsuarioDetalleResponse,
)
def obtener_usuario(
    usuario_id: UUID,
    _: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> AdminUsuarioDetalleResponse:
    usuario = (
        db.query(Usuario)
        .options(
            selectinload(Usuario.perfil)
            .selectinload(PerfilUsuario.tecnologias)
            .joinedload(PerfilTecnologia.categoria)
        )
        .filter(Usuario.id == usuario_id)
        .first()
    )
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    ruta = (
        db.query(RutaAprendizaje)
        .options(selectinload(RutaAprendizaje.modulos).selectinload(Modulo.recursos))
        .filter(
            RutaAprendizaje.usuario_id == usuario.id,
            RutaAprendizaje.estado == "activa",
        )
        .order_by(
            RutaAprendizaje.created_at.desc(),
            RutaAprendizaje.id.desc(),
        )
        .first()
    )

    estados: dict[UUID, str] = {}
    modulos: list[Modulo] = []
    if ruta is not None:
        modulos = sorted(ruta.modulos, key=lambda modulo: modulo.orden)
        modulo_ids = [modulo.id for modulo in modulos]
        estados = obtener_estados_modulos(db, usuario.id, modulo_ids)

    total_modulos = len(modulos)
    modulos_completados = sum(
        estados.get(modulo.id) == "completado" for modulo in modulos
    )
    modulos_en_progreso = sum(
        estados.get(modulo.id) == "en_progreso" for modulo in modulos
    )

    ultima_actividad_modulo = (
        db.query(func.max(Progreso.updated_at))
        .filter(Progreso.usuario_id == usuario.id)
        .scalar()
    )
    ultima_actividad_recurso = (
        db.query(func.max(RecursoProgreso.updated_at))
        .filter(RecursoProgreso.usuario_id == usuario.id)
        .scalar()
    )
    ultima_actividad = max(
        filter(
            None,
            [ultima_actividad_modulo, ultima_actividad_recurso, usuario.created_at],
        )
    )

    rutas_archivadas = (
        db.query(RutaAprendizaje)
        .options(selectinload(RutaAprendizaje.modulos))
        .filter(
            RutaAprendizaje.usuario_id == usuario.id,
            RutaAprendizaje.estado == "archivada",
        )
        .order_by(
            RutaAprendizaje.created_at.desc(),
            RutaAprendizaje.id.desc(),
        )
        .all()
    )

    historial_rutas: list[AdminRutaHistorialResponse] = []
    for ruta_archivada in rutas_archivadas:
        modulo_ids_archivados = [modulo.id for modulo in ruta_archivada.modulos]
        estados_archivados = obtener_estados_modulos(
            db, usuario.id, modulo_ids_archivados
        )
        total_archivados = len(modulo_ids_archivados)
        completados_archivados = sum(
            estados_archivados.get(modulo.id) == "completado"
            for modulo in ruta_archivada.modulos
        )
        historial_rutas.append(
            AdminRutaHistorialResponse(
                id=ruta_archivada.id,
                titulo=ruta_archivada.titulo,
                estado=ruta_archivada.estado,
                desde_cache=bool(ruta_archivada.desde_cache),
                created_at=ruta_archivada.created_at,
                nivel_actual=ruta_archivada.nivel_actual,
                tecnologias=ruta_archivada.tecnologias_nombres or [],
                total_modulos=total_archivados,
                modulos_completados=completados_archivados,
                porcentaje=calcular_porcentaje(
                    completados_archivados, total_archivados
                ),
            )
        )

    perfil = usuario.perfil
    tecnologias = (
        sorted(
            perfil.tecnologias,
            key=lambda tecnologia: tecnologia.categoria.nombre.lower(),
        )
        if perfil is not None
        else []
    )

    return AdminUsuarioDetalleResponse(
        id=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        rol=usuario.rol,
        created_at=usuario.created_at,
        ultima_actividad=ultima_actividad,
        perfil=(
            AdminPerfilUsuarioResponse.model_validate(perfil)
            if perfil is not None
            else None
        ),
        tecnologias=[
            AdminTecnologiaUsuarioResponse(
                id=tecnologia.id,
                categoria_id=tecnologia.categoria_id,
                nombre=tecnologia.categoria.nombre,
                descripcion=tecnologia.categoria.descripcion,
            )
            for tecnologia in tecnologias
        ],
        ruta_activa=(
            AdminRutaActivaResponse(
                id=ruta.id,
                titulo=ruta.titulo,
                estado=ruta.estado,
                desde_cache=bool(ruta.desde_cache),
                created_at=ruta.created_at,
                total_modulos=total_modulos,
                modulos=[
                    AdminModuloRutaResponse(
                        id=modulo.id,
                        titulo=modulo.titulo,
                        nivel=modulo.nivel,
                        tiempo_estimado_hrs=modulo.tiempo_estimado_hrs,
                        orden=modulo.orden,
                        estado_progreso=estados.get(modulo.id, "pendiente"),
                        actividad_practica=modulo.actividad_practica,
                        dependencias=modulo.dependencias,
                    )
                    for modulo in modulos
                ],
            )
            if ruta is not None
            else None
        ),
        progreso=(
            AdminProgresoResumenResponse(
                total_modulos=total_modulos,
                modulos_completados=modulos_completados,
                modulos_en_progreso=modulos_en_progreso,
                modulos_pendientes=(
                    total_modulos - modulos_completados - modulos_en_progreso
                ),
                porcentaje=calcular_porcentaje(
                    modulos_completados,
                    total_modulos,
                ),
            )
            if ruta is not None
            else None
        ),
        rutas_archivadas=historial_rutas,
    )
