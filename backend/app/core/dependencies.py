from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.usuario import Usuario

security = HTTPBearer(auto_error=False)


def _unauthorized(detail: str = "Token inválido o expirado") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    if credentials is None:
        raise _unauthorized("No autenticado")

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise _unauthorized()

    try:
        usuario_id = UUID(payload.get("usuario_id"))
    except (ValueError, TypeError):
        raise _unauthorized()

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise _unauthorized("Usuario no encontrado")

    return usuario


def get_current_admin_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """Verifica que el usuario autenticado tenga rol de administrador."""
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a este recurso",
        )
    return current_user


# Alias conservado para no romper imports existentes.
get_current_admin = get_current_admin_user
