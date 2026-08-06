import unicodedata
from collections.abc import Callable, Hashable, Iterable
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.dependencia_modulo import DependenciaModulo
from app.models.modulo import Modulo
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.models.recurso import Recurso
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario
from app.schemas.ruta import RutaResponse
from app.schemas.ruta_ia import ModuloIA, RecursoIA, RutaIAResponse
from app.services.gemini_service import (
    GeminiServiceError,
    _obtener_tecnologias,
    generar_ruta_con_gemini,
    obtener_limites_modulos,
)

router = APIRouter()


def _obtener_perfil_usuario(db: Session, usuario_id: UUID) -> PerfilUsuario | None:
    return (
        db.query(PerfilUsuario)
        .options(
            joinedload(PerfilUsuario.tecnologias).joinedload(PerfilTecnologia.categoria)
        )
        .filter(PerfilUsuario.usuario_id == usuario_id)
        .first()
    )


def _crear_recursos(
    db: Session,
    modulo_id: UUID,
    recursos: Iterable[RecursoIA | Recurso],
) -> None:
    for recurso_origen in recursos:
        db.add(
            Recurso(
                modulo_id=modulo_id,
                titulo=recurso_origen.titulo,
                tipo=recurso_origen.tipo,
                url=recurso_origen.url,
            )
        )


def _crear_modulos(
    db: Session,
    ruta_id: UUID,
    modulos: Iterable[ModuloIA | Modulo],
    obtener_clave: Callable[[ModuloIA | Modulo], Hashable],
) -> dict[Hashable, Modulo]:
    modulos_creados: dict[Hashable, Modulo] = {}

    for modulo_origen in modulos:
        modulo = Modulo(
            ruta_id=ruta_id,
            titulo=modulo_origen.titulo,
            nivel=modulo_origen.nivel,
            tiempo_estimado_hrs=modulo_origen.tiempo_estimado_hrs,
            orden=modulo_origen.orden,
            actividad_practica=getattr(modulo_origen, "actividad_practica", None),
        )
        db.add(modulo)
        db.flush()

        modulos_creados[obtener_clave(modulo_origen)] = modulo
        _crear_recursos(db, modulo.id, modulo_origen.recursos)

    return modulos_creados


def _crear_dependencias(
    db: Session,
    relaciones: Iterable[tuple[Hashable, Hashable]],
    modulos_creados: dict[Hashable, Modulo],
) -> None:
    for modulo_clave, dependencia_clave in relaciones:
        db.add(
            DependenciaModulo(
                modulo_id=modulos_creados[modulo_clave].id,
                depende_de_id=modulos_creados[dependencia_clave].id,
            )
        )


def _guardar_ruta_generada(
    db: Session,
    perfil: PerfilUsuario,
    ruta_ia: RutaIAResponse,
) -> RutaAprendizaje:
    ruta = RutaAprendizaje(
        usuario_id=perfil.usuario_id,
        titulo=ruta_ia.titulo,
        estado="activa",
        desde_cache=False,
        nivel_actual=perfil.nivel_actual,
        tecnologias_nombres=_obtener_tecnologias(perfil),
    )
    db.add(ruta)
    db.flush()

    modulos_ordenados = sorted(ruta_ia.modulos, key=lambda modulo: modulo.orden)
    modulos_creados = _crear_modulos(
        db,
        ruta.id,
        modulos_ordenados,
        obtener_clave=lambda modulo: modulo.clave,
    )
    relaciones = (
        (modulo.clave, dependencia)
        for modulo in ruta_ia.modulos
        for dependencia in modulo.dependencias
    )
    _crear_dependencias(db, relaciones, modulos_creados)

    return ruta


def _clonar_ruta_existente(
    db: Session,
    ruta_origen: RutaAprendizaje,
    perfil: PerfilUsuario,
) -> RutaAprendizaje:
    ruta = RutaAprendizaje(
        usuario_id=perfil.usuario_id,
        titulo=ruta_origen.titulo,
        estado="activa",
        desde_cache=True,
        nivel_actual=perfil.nivel_actual,
        tecnologias_nombres=_obtener_tecnologias(perfil),
    )
    db.add(ruta)
    db.flush()

    modulos_ordenados = sorted(ruta_origen.modulos, key=lambda modulo: modulo.orden)
    modulos_creados = _crear_modulos(
        db,
        ruta.id,
        modulos_ordenados,
        obtener_clave=lambda modulo: modulo.id,
    )
    relaciones = (
        (modulo.id, dependencia.depende_de_id)
        for modulo in ruta_origen.modulos
        for dependencia in modulo.dependencias
    )
    _crear_dependencias(db, relaciones, modulos_creados)

    return ruta


def _normalizar_meta_profesional(meta_profesional: str) -> str:
    meta_normalizada = unicodedata.normalize("NFKC", meta_profesional).casefold()
    return " ".join(meta_normalizada.split())


def _obtener_categorias(perfil: PerfilUsuario) -> frozenset[UUID]:
    return frozenset(tecnologia.categoria_id for tecnologia in perfil.tecnologias)


def _buscar_ruta_compatible_en_cache(
    db: Session,
    perfil: PerfilUsuario,
) -> RutaAprendizaje | None:
    """Busca una ruta ya generada para otro usuario con perfil equivalente
    (misma meta profesional normalizada, mismo nivel y mismas categorias de
    tecnologia), para reutilizarla en vez de llamar a Gemini de nuevo.

    Entre las rutas compatibles, retorna la mas reciente cuya cantidad de
    modulos caiga dentro del rango esperado para la cantidad de categorias
    del perfil (ver obtener_limites_modulos), o None si no hay ninguna.
    """
    perfiles_candidatos = (
        db.query(PerfilUsuario)
        .options(joinedload(PerfilUsuario.tecnologias))
        .filter(
            PerfilUsuario.usuario_id != perfil.usuario_id,
            PerfilUsuario.nivel_actual == perfil.nivel_actual,
        )
        .all()
    )

    meta_normalizada = _normalizar_meta_profesional(perfil.meta_profesional)
    categorias = _obtener_categorias(perfil)
    usuarios_compatibles = [
        candidato.usuario_id
        for candidato in perfiles_candidatos
        if _normalizar_meta_profesional(candidato.meta_profesional) == meta_normalizada
        and _obtener_categorias(candidato) == categorias
    ]

    if not usuarios_compatibles:
        return None

    rutas_compatibles = (
        db.query(RutaAprendizaje)
        .options(
            joinedload(RutaAprendizaje.modulos).joinedload(Modulo.recursos),
            joinedload(RutaAprendizaje.modulos).joinedload(Modulo.dependencias),
        )
        .filter(
            RutaAprendizaje.usuario_id.in_(usuarios_compatibles),
            RutaAprendizaje.modulos.any(),
        )
        .order_by(RutaAprendizaje.created_at.desc())
        .all()
    )

    minimo_modulos, maximo_modulos = obtener_limites_modulos(len(categorias))
    return next(
        (
            ruta
            for ruta in rutas_compatibles
            if minimo_modulos <= len(ruta.modulos) <= maximo_modulos
        ),
        None,
    )


def _crear_ruta_para_usuario(
    db: Session,
    perfil: PerfilUsuario,
) -> RutaAprendizaje:
    ruta_en_cache = _buscar_ruta_compatible_en_cache(db, perfil)
    if ruta_en_cache is not None:
        return _clonar_ruta_existente(db, ruta_en_cache, perfil)

    ruta_ia = generar_ruta_con_gemini(perfil)
    return _guardar_ruta_generada(db, perfil, ruta_ia)


def _archivar_rutas_activas(db: Session, usuario_id: UUID) -> None:
    rutas_activas = (
        db.query(RutaAprendizaje)
        .filter(
            RutaAprendizaje.usuario_id == usuario_id,
            RutaAprendizaje.estado == "activa",
        )
        .all()
    )
    for ruta in rutas_activas:
        ruta.estado = "archivada"


def _generar_ruta_usuario(
    db: Session,
    usuario_id: UUID,
    archivar_rutas_activas: bool,
) -> RutaAprendizaje:
    perfil = _obtener_perfil_usuario(db, usuario_id)
    if perfil is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene perfil.",
        )

    try:
        if archivar_rutas_activas:
            _archivar_rutas_activas(db, usuario_id)

        ruta = _crear_ruta_para_usuario(db, perfil)
        db.commit()
        db.refresh(ruta)
        return ruta
    except GeminiServiceError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar la ruta.",
        ) from exc


@router.post(
    "/generar", response_model=RutaResponse, status_code=status.HTTP_201_CREATED
)
def generar_ruta(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _generar_ruta_usuario(
        db=db,
        usuario_id=current_user.id,
        archivar_rutas_activas=False,
    )


@router.post(
    "/regenerar",
    response_model=RutaResponse,
    status_code=status.HTTP_201_CREATED,
)
def regenerar_ruta(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _generar_ruta_usuario(
        db=db,
        usuario_id=current_user.id,
        archivar_rutas_activas=True,
    )
