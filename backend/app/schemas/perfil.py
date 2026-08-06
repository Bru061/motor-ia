from uuid import UUID

from pydantic import BaseModel


class CategoriaResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: str | None = None

    class Config:
        from_attributes = True


class PerfilTecnologiaResponse(BaseModel):
    categoria: CategoriaResponse

    class Config:
        from_attributes = True


class PerfilCreate(BaseModel):
    meta_profesional: str
    nivel_actual: str
    categorias_ids: list[UUID]


class PerfilUpdate(BaseModel):
    meta_profesional: str | None = None
    nivel_actual: str | None = None
    categorias_ids: list[UUID] | None = None


class PerfilResponse(BaseModel):
    id: UUID
    meta_profesional: str
    nivel_actual: str
    tecnologias: list[PerfilTecnologiaResponse] = []

    class Config:
        from_attributes = True
