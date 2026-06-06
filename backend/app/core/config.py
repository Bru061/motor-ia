from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # General
    APP_NAME: str = "SmartPath AI"
    DEBUG: bool = False

    # Base de datos
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Gemini
    GEMINI_API_KEY: str

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
