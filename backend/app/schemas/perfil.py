from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


class CategoriaResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class PerfilTecnologiaResponse(BaseModel):
    categoria: CategoriaResponse

    class Config:
        from_attributes = True


class PerfilCreate(BaseModel):
    meta_profesional: str
    nivel_actual: str
    categorias_ids: List[UUID]


class PerfilUpdate(BaseModel):
    meta_profesional: Optional[str] = None
    nivel_actual: Optional[str] = None
    categorias_ids: Optional[List[UUID]] = None


class PerfilResponse(BaseModel):
    id: UUID
    meta_profesional: str
    nivel_actual: str
    tecnologias: List[PerfilTecnologiaResponse] = []

    class Config:
        from_attributes = True