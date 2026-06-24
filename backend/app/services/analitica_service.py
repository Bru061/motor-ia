import re
import unicodedata
from collections import Counter

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.categoria_tecnologia import CategoriaTecnologia
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.schemas.analitica import (
    SkillGapItem,
    SkillGapResponse,
    TecnologiaDemandadaItem,
    TecnologiasDemandadasResponse,
)


# El mapa usa exclusivamente categorias disponibles en el catalogo real.
TECNOLOGIAS_REQUERIDAS_POR_META: dict[str, tuple[str, ...]] = {
    "backend": (
        "Backend",
        "Base de datos",
        "Control de versiones",
        "DevOps",
    ),
    "frontend": (
        "Frontend",
        "Control de versiones",
    ),
    "fullstack": (
        "Frontend",
        "Backend",
        "Base de datos",
        "Control de versiones",
    ),
    "data": (
        "Data Science",
        "Base de datos",
        "Control de versiones",
    ),
    "ia": (
        "Data Science",
        "Base de datos",
        "Control de versiones",
    ),
    "mobile": (
        "Mobile",
        "Backend",
        "Control de versiones",
    ),
    "devops": (
        "DevOps",
        "Control de versiones",
        "Seguridad",
    ),
    "seguridad": (
        "Seguridad",
        "Backend",
        "Control de versiones",
    ),
}


# El orden importa: las metas mas especificas se evaluan primero.
PALABRAS_CLAVE_POR_META: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("fullstack", ("full stack", "fullstack")),
    (
        "ia",
        (
            "inteligencia artificial",
            "machine learning",
            "deep learning",
            "aprendizaje automatico",
            "ai",
            "ia",
        ),
    ),
    (
        "data",
        (
            "data science",
            "data scientist",
            "cientifico de datos",
            "cientifica de datos",
            "analisis de datos",
            "analista de datos",
        ),
    ),
    ("devops", ("devops", "sre", "site reliability")),
    (
        "seguridad",
        ("ciberseguridad", "cybersecurity", "seguridad informatica"),
    ),
    (
        "mobile",
        (
            "mobile",
            "movil",
            "moviles",
            "android",
            "ios",
            "flutter",
            "react native",
        ),
    ),
    ("frontend", ("front end", "frontend")),
    ("backend", ("back end", "backend")),
)


def normalizar_texto(texto: str | None) -> str:
    if not texto:
        return ""

    sin_acentos = "".join(
        caracter
        for caracter in unicodedata.normalize("NFKD", texto)
        if not unicodedata.combining(caracter)
    )
    limpio = re.sub(r"[^a-z0-9]+", " ", sin_acentos.lower())
    return " ".join(limpio.split())


def clasificar_meta_profesional(meta_profesional: str | None) -> str | None:
    meta = normalizar_texto(meta_profesional)
    if not meta:
        return None

    meta_delimitada = f" {meta} "
    for clasificacion, palabras_clave in PALABRAS_CLAVE_POR_META:
        if any(
            f" {palabra} " in meta_delimitada
            for palabra in palabras_clave
        ):
            return clasificacion

    return "sin_clasificar"


def obtener_tecnologias_demandadas(
    db: Session,
) -> TecnologiasDemandadasResponse:
    total_perfiles = db.query(func.count(PerfilUsuario.id)).scalar() or 0
    if total_perfiles == 0:
        return TecnologiasDemandadasResponse(total_perfiles_analizados=0)

    total_por_categoria = func.count(
        func.distinct(PerfilTecnologia.perfil_id)
    )
    filas = (
        db.query(
            CategoriaTecnologia.id,
            CategoriaTecnologia.nombre,
            CategoriaTecnologia.descripcion,
            total_por_categoria.label("total_usuarios"),
        )
        .join(
            PerfilTecnologia,
            PerfilTecnologia.categoria_id == CategoriaTecnologia.id,
        )
        .join(
            PerfilUsuario,
            PerfilUsuario.id == PerfilTecnologia.perfil_id,
        )
        .group_by(
            CategoriaTecnologia.id,
            CategoriaTecnologia.nombre,
            CategoriaTecnologia.descripcion,
        )
        .order_by(
            total_por_categoria.desc(),
            CategoriaTecnologia.nombre.asc(),
        )
        .all()
    )

    return TecnologiasDemandadasResponse(
        total_perfiles_analizados=total_perfiles,
        tecnologias=[
            TecnologiaDemandadaItem(
                categoria_id=fila.id,
                nombre=fila.nombre,
                descripcion=fila.descripcion,
                total_usuarios=fila.total_usuarios,
                porcentaje=round(
                    fila.total_usuarios * 100 / total_perfiles,
                    2,
                ),
            )
            for fila in filas
        ],
    )


def calcular_skill_gap(db: Session) -> SkillGapResponse:
    perfiles = (
        db.query(PerfilUsuario)
        .options(
            selectinload(PerfilUsuario.tecnologias).options(
                joinedload(PerfilTecnologia.categoria)
            )
        )
        .all()
    )

    total_analizados = 0
    total_sin_clasificar = 0
    brechas: Counter[str] = Counter()

    for perfil in perfiles:
        clasificacion = clasificar_meta_profesional(perfil.meta_profesional)
        if clasificacion is None:
            continue

        total_analizados += 1
        if clasificacion == "sin_clasificar":
            total_sin_clasificar += 1
            continue

        tecnologias_declaradas = {
            normalizar_texto(tecnologia.categoria.nombre)
            for tecnologia in perfil.tecnologias
            if tecnologia.categoria is not None
        }
        requeridas = TECNOLOGIAS_REQUERIDAS_POR_META[clasificacion]
        for tecnologia_requerida in requeridas:
            tecnologia_normalizada = normalizar_texto(tecnologia_requerida)
            if tecnologia_normalizada not in tecnologias_declaradas:
                brechas[tecnologia_requerida] += 1

    brechas_ordenadas = sorted(
        brechas.items(),
        key=lambda item: (-item[1], normalizar_texto(item[0])),
    )

    return SkillGapResponse(
        total_perfiles_analizados=total_analizados,
        total_perfiles_sin_clasificar=total_sin_clasificar,
        brechas=[
            SkillGapItem(
                tecnologia=tecnologia,
                usuarios_con_brecha=total,
                porcentaje=(
                    round(total * 100 / total_analizados, 2)
                    if total_analizados
                    else 0.0
                ),
            )
            for tecnologia, total in brechas_ordenadas
        ],
    )
