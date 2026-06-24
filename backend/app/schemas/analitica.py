from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TecnologiaDemandadaItem(BaseModel):
    categoria_id: UUID
    nombre: str
    descripcion: str | None = None
    total_usuarios: int
    porcentaje: float

    model_config = ConfigDict(from_attributes=True)


class TecnologiasDemandadasResponse(BaseModel):
    total_perfiles_analizados: int
    tecnologias: list[TecnologiaDemandadaItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SkillGapItem(BaseModel):
    tecnologia: str
    usuarios_con_brecha: int
    porcentaje: float

    model_config = ConfigDict(from_attributes=True)


class SkillGapResponse(BaseModel):
    total_perfiles_analizados: int
    total_perfiles_sin_clasificar: int
    brechas: list[SkillGapItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
