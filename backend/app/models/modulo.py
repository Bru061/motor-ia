import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class Modulo(Base):
    __tablename__ = "modulos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ruta_id = Column(UUID(as_uuid=True), ForeignKey("rutas_aprendizaje.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    nivel = Column(String(20), nullable=False)  # junior, intermediate, advanced
    tiempo_estimado_hrs = Column(Integer, nullable=False, default=0)
    orden = Column(Integer, nullable=False, default=0)
    # Nullable: los módulos generados antes de esta función no la tienen.
    actividad_practica = Column(Text, nullable=True)

    # Relaciones
    ruta = relationship("RutaAprendizaje", back_populates="modulos")
    recursos = relationship("Recurso", back_populates="modulo")
    dependencias = relationship("DependenciaModulo", foreign_keys="DependenciaModulo.modulo_id", back_populates="modulo")
    progresos = relationship("Progreso", back_populates="modulo")