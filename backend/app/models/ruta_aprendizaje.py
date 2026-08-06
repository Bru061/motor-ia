import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class RutaAprendizaje(Base):
    __tablename__ = "rutas_aprendizaje"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    estado = Column(
        String(20), nullable=False, default="activa"
    )  # activa, completada, archivada
    desde_cache = Column(Boolean, default=False)
    # Snapshot del perfil del usuario en el momento en que se generó/clonó esta ruta.
    # Nullable: rutas creadas antes de esta función no lo tienen.
    nivel_actual = Column(String(20), nullable=True)
    # JSON generico con variante JSONB en Postgres: en SQLite (tests) cae al
    # tipo JSON estandar, porque JSONB es un tipo exclusivo de Postgres y no
    # tiene equivalente compilable en otros dialectos.
    tecnologias_nombres = Column(
        JSON().with_variant(JSONB, "postgresql"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="rutas")
    modulos = relationship("Modulo", back_populates="ruta")
