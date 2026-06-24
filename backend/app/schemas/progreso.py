from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ruta import DependenciaModuloResponse


EstadoProgreso = Literal["pendiente", "en_progreso", "completado"]


class ProgresoEstadoRequest(BaseModel):
    estado: EstadoProgreso


class ProgresoModuloResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    modulo_id: UUID
    estado: EstadoProgreso
    completado_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProgresoRecursoResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    recurso_id: UUID
    estado: EstadoProgreso
    completado_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class RecursoConProgresoResponse(BaseModel):
    id: UUID
    titulo: str
    tipo: str
    url: str
    estado: EstadoProgreso


class ModuloConProgresoResponse(BaseModel):
    id: UUID
    titulo: str
    nivel: str
    tiempo_estimado_hrs: int
    orden: int
    estado: EstadoProgreso
    recursos: list[RecursoConProgresoResponse] = Field(default_factory=list)
    dependencias: list[DependenciaModuloResponse] = Field(default_factory=list)


class RutaActivaConProgresoResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    titulo: str
    estado: str
    desde_cache: bool
    created_at: datetime
    modulos: list[ModuloConProgresoResponse] = Field(default_factory=list)


class ResumenProgresoResponse(BaseModel):
    total_modulos: int
    modulos_completados: int
    modulos_pendientes: int
    modulos_en_progreso: int
    porcentaje_avance: float
    total_recursos: int
    recursos_completados: int
    porcentaje_modulos: float
    porcentaje_recursos: float
    porcentaje_general: float
