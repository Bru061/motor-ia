from fastapi import APIRouter

from app.api.v1.endpoints import analitica, admin, auth, perfil, progreso, rutas


api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(
    perfil.router,
    prefix="/perfil",
    tags=["Perfil y Skill Assessment"],
)
api_router.include_router(
    rutas.router,
    prefix="/rutas",
    tags=["Rutas de aprendizaje"],
)
api_router.include_router(
    progreso.router,
    prefix="/progreso",
    tags=["progreso"],
)
api_router.include_router(
    analitica.router,
    prefix="/admin/analitica",
    tags=["Analítica administrativa"],
)
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Administración"],
)
