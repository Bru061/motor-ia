import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class RecursoProgreso(Base):
    __tablename__ = "recursos_progreso"
    __table_args__ = (
        UniqueConstraint(
            "usuario_id",
            "recurso_id",
            name="uq_recurso_progreso_usuario_recurso",
        ),
        CheckConstraint(
            "estado IN ('pendiente', 'en_progreso', 'completado')",
            name="ck_recurso_progreso_estado_valido",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    recurso_id = Column(UUID(as_uuid=True), ForeignKey("recursos.id"), nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente")
    completado_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    visto = Column(Boolean, default=False)
    visto_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="recursos_progreso")
    recurso = relationship("Recurso", back_populates="recursos_progreso")
