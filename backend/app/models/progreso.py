import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Progreso(Base):
    __tablename__ = "progreso"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    modulo_id = Column(UUID(as_uuid=True), ForeignKey("modulos.id"), nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente")  # pendiente, en_progreso, completado
    completado_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="progresos")
    modulo = relationship("Modulo", back_populates="progresos")