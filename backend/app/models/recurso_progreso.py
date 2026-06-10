import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class RecursoProgreso(Base):
    __tablename__ = "recursos_progreso"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    recurso_id = Column(UUID(as_uuid=True), ForeignKey("recursos.id"), nullable=False)
    visto = Column(Boolean, default=False)
    visto_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="recursos_progreso")
    recurso = relationship("Recurso", back_populates="recursos_progreso")