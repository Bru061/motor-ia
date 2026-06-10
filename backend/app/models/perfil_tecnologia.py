import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class PerfilTecnologia(Base):
    __tablename__ = "perfil_tecnologias"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    perfil_id = Column(UUID(as_uuid=True), ForeignKey("perfil_usuario.id"), nullable=False)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias_tecnologia.id"), nullable=False)

    # Relaciones
    perfil = relationship("PerfilUsuario", back_populates="tecnologias")
    categoria = relationship("CategoriaTecnologia", back_populates="perfiles")