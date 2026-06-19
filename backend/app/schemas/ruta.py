from datetime import datetime
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class RecursoResponse(BaseModel):
    id: UUID
    titulo: str
    tipo: str
    url: str
    model_config = ConfigDict(from_attributes=True)


class DependenciaModuloResponse(BaseModel):
    id: UUID
    modulo_id: UUID
    depende_de_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ModuloResponse(BaseModel):
    id: UUID
    titulo: str
    nivel: str
    tiempo_estimado_hrs: int
    orden: int
    recursos: List[RecursoResponse] = []
    dependencias: List[DependenciaModuloResponse] = []
    model_config = ConfigDict(from_attributes=True)


class RutaResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    titulo: str
    estado: str
    desde_cache: bool
    created_at: datetime
    modulos: List[ModuloResponse] = []
    model_config = ConfigDict(from_attributes=True)