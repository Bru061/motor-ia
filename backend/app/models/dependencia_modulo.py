import uuid

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class DependenciaModulo(Base):
    __tablename__ = "dependencias_modulo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modulo_id = Column(UUID(as_uuid=True), ForeignKey("modulos.id"), nullable=False)
    depende_de_id = Column(UUID(as_uuid=True), ForeignKey("modulos.id"), nullable=False)

    # Relaciones
    modulo = relationship(
        "Modulo", foreign_keys=[modulo_id], back_populates="dependencias"
    )
    depende_de = relationship("Modulo", foreign_keys=[depende_de_id])
