import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class CategoriaTecnologia(Base):
    __tablename__ = "categorias_tecnologia"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(String(255), nullable=True)

    # Relaciones
    perfiles = relationship("PerfilTecnologia", back_populates="categoria")
