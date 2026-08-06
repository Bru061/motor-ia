import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class PerfilUsuario(Base):
    __tablename__ = "perfil_usuario"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, unique=True
    )
    meta_profesional = Column(String(255), nullable=False)
    nivel_actual = Column(String(20), nullable=False)  # junior, mid, senior
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relaciones
    usuario = relationship("Usuario", back_populates="perfil")
    tecnologias = relationship("PerfilTecnologia", back_populates="perfil")
