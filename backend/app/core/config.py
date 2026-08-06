from pydantic_settings import BaseSettings, NoDecode
from pydantic import field_validator
from typing import List
from typing_extensions import Annotated


class Settings(BaseSettings):
    # General
    APP_NAME: str = "MotorIA"
    DEBUG: bool = False

    # Base de datos
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/motoria"

    # JWT
    SECRET_KEY: str = "[ENCRYPTION_KEY]"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Google OAuth
    GOOGLE_CLIENT_ID: str

    # Correo (recuperación de contraseña)
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str = "MotorIA <onboarding@resend.dev>"
    FRONTEND_URL: str = "http://localhost:5173"
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # CORS
    ALLOWED_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:5173"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str) -> List[str]:
        """Convierte string de origenes separados por coma en lista"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"


settings = Settings()
