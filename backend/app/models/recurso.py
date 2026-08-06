import uuid

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Recurso(Base):
    __tablename__ = "recursos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modulo_id = Column(UUID(as_uuid=True), ForeignKey("modulos.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=False)  # video, articulo, documentacion
    url = Column(String(500), nullable=False)

    # Relaciones
    modulo = relationship("Modulo", back_populates="recursos")
    recursos_progreso = relationship("RecursoProgreso", back_populates="recurso")
