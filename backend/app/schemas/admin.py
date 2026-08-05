from datetime import datetime
from typing import Literal
from uuid import UUID
from app.schemas.ruta import DependenciaModuloResponse
from pydantic import BaseModel, ConfigDict, Field


class AdminUsuarioListItem(BaseModel):
    id: UUID
    email: str
    nombre: str
    rol: str
    meta_profesional: str | None = None
    created_at: datetime | None = None
    tiene_perfil: bool
    tiene_ruta_activa: bool

    model_config = ConfigDict(from_attributes=True)


class AdminUsuariosListResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    usuarios: list[AdminUsuarioListItem] = Field(default_factory=list)


class AdminPerfilUsuarioResponse(BaseModel):
    id: UUID
    meta_profesional: str
    nivel_actual: str
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminTecnologiaUsuarioResponse(BaseModel):
    id: UUID
    categoria_id: UUID
    nombre: str
    descripcion: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminModuloRutaResponse(BaseModel):
    id: UUID
    titulo: str
    nivel: str
    tiempo_estimado_hrs: int
    orden: int
    estado_progreso: Literal["pendiente", "en_progreso", "completado"]
    actividad_practica: str | None = None
    dependencias: list[DependenciaModuloResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminRutaActivaResponse(BaseModel):
    id: UUID
    titulo: str
    estado: str
    desde_cache: bool
    created_at: datetime | None = None
    total_modulos: int
    modulos: list[AdminModuloRutaResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminProgresoResumenResponse(BaseModel):
    total_modulos: int
    modulos_completados: int
    modulos_en_progreso: int
    modulos_pendientes: int
    porcentaje: float


class AdminRutaHistorialResponse(BaseModel):
    id: UUID
    titulo: str
    estado: str
    desde_cache: bool
    created_at: datetime | None = None
    nivel_actual: str | None = None
    tecnologias: list[str] = Field(default_factory=list)
    total_modulos: int
    modulos_completados: int
    porcentaje: float

    model_config = ConfigDict(from_attributes=True)


class AdminUsuarioDetalleResponse(BaseModel):
    id: UUID
    email: str
    nombre: str
    rol: str
    created_at: datetime | None = None
    ultima_actividad: datetime | None = None
    perfil: AdminPerfilUsuarioResponse | None = None
    tecnologias: list[AdminTecnologiaUsuarioResponse] = Field(
        default_factory=list
    )
    ruta_activa: AdminRutaActivaResponse | None = None
    progreso: AdminProgresoResumenResponse | None = None
    rutas_archivadas: list[AdminRutaHistorialResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)
