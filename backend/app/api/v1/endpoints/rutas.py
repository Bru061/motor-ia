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
from app.services.gemini_service import GeminiServiceError, generar_ruta_con_gemini

router = APIRouter()


@router.post("/generar", response_model=RutaResponse, status_code=status.HTTP_201_CREATED)
async def generar_ruta(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perfil = (
        db.query(PerfilUsuario)
        .options(joinedload(PerfilUsuario.tecnologias).joinedload(PerfilTecnologia.categoria))
        .filter(PerfilUsuario.usuario_id == current_user.id)
        .first()
    )

    if not perfil:
        raise HTTPException(status_code=404, detail="El usuario no tiene perfil.")

    try:
        ruta_ia = generar_ruta_con_gemini(perfil)

        ruta = RutaAprendizaje(
            usuario_id=current_user.id,
            titulo=ruta_ia.titulo,
            estado="activa",
            desde_cache=False,
        )
        db.add(ruta)
        db.flush()

        modulos_por_clave = {}

        for modulo_ia in sorted(ruta_ia.modulos, key=lambda m: m.orden):
            modulo = Modulo(
                ruta_id=ruta.id,
                titulo=modulo_ia.titulo,
                nivel=modulo_ia.nivel,
                tiempo_estimado_hrs=modulo_ia.tiempo_estimado_hrs,
                orden=modulo_ia.orden,
            )
            db.add(modulo)
            db.flush()
            modulos_por_clave[modulo_ia.clave] = modulo

            for recurso_ia in modulo_ia.recursos:
                db.add(Recurso(
                    modulo_id=modulo.id,
                    titulo=recurso_ia.titulo,
                    tipo=recurso_ia.tipo,
                    url=recurso_ia.url,
                ))

        for modulo_ia in ruta_ia.modulos:
            modulo = modulos_por_clave[modulo_ia.clave]
            for dep_clave in modulo_ia.dependencias:
                db.add(DependenciaModulo(
                    modulo_id=modulo.id,
                    depende_de_id=modulos_por_clave[dep_clave].id,
                ))

        db.commit()
        db.refresh(ruta)
        return ruta

    except GeminiServiceError as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo guardar la ruta.") from exc