from fastapi import APIRouter
from fastapi import APIRouter
from app.api.v1.endpoints import auth, perfil

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(perfil.router, prefix="/perfil", tags=["Perfil y Skill Assessment"])