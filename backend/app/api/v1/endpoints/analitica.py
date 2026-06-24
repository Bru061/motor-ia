from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin_user
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.analitica import (
    SkillGapResponse,
    TecnologiasDemandadasResponse,
)
from app.services.analitica_service import (
    calcular_skill_gap,
    obtener_tecnologias_demandadas,
)


router = APIRouter()


@router.get(
    "/tecnologias-demandadas",
    response_model=TecnologiasDemandadasResponse,
)
def tecnologias_demandadas(
    _: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> TecnologiasDemandadasResponse:
    return obtener_tecnologias_demandadas(db)


@router.get("/skill-gap", response_model=SkillGapResponse)
def skill_gap(
    _: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> SkillGapResponse:
    return calcular_skill_gap(db)
