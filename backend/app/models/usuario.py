import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="estudiante")
    first_login = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    perfil = relationship("PerfilUsuario", back_populates="usuario", uselist=False)
    rutas = relationship("RutaAprendizaje", back_populates="usuario")
    progresos = relationship("Progreso", back_populates="usuario")
    recursos_progreso = relationship("RecursoProgreso", back_populates="usuario")