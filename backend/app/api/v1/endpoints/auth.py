import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
    hash_reset_token,
)
from app.models.usuario import Usuario
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter()
_google_request = google_requests.Request()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(request: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuevo usuario y retorna un JWT."""

    # Verificar si el correo ya existe
    existing = db.query(Usuario).filter(Usuario.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )

    # Crear el usuario
    usuario = Usuario(
        nombre=request.nombre,
        email=request.email,
        password_hash=hash_password(request.password),
        rol="estudiante",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    # Generar JWT
    token = create_access_token({
        "usuario_id": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol,
    })

    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre)


@router.post("/login", response_model=TokenResponse)
async def iniciar_sesion(request: LoginRequest, db: Session = Depends(get_db)):
    """Autentica un usuario y retorna un JWT."""

    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()

    if (
        not usuario
        or not usuario.password_hash
        or not verify_password(request.password, usuario.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    token = create_access_token({
        "usuario_id": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol,
    })

    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre)


@router.post("/google", response_model=TokenResponse)
async def autenticar_con_google(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Autentica (o registra) un usuario a partir de un ID token de Google."""

    try:
        payload = google_id_token.verify_oauth2_token(
            request.credential,
            _google_request,
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        logger.warning("Fallo la verificacion del token de Google: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado",
        )

    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de Google no incluye un correo electrónico",
        )

    if payload.get("email_verified") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo de Google no está verificado",
        )

    google_id = payload["sub"]
    nombre = payload.get("name") or email.split("@")[0]

    usuario = db.query(Usuario).filter(Usuario.google_id == google_id).first()

    if not usuario:
        # Puede existir ya una cuenta local con ese correo: la vinculamos.
        usuario = db.query(Usuario).filter(Usuario.email == email).first()

        if usuario:
            usuario.google_id = google_id
            if usuario.auth_provider == "local" and not usuario.password_hash:
                usuario.auth_provider = "google"
        else:
            usuario = Usuario(
                nombre=nombre,
                email=email,
                password_hash=None,
                google_id=google_id,
                auth_provider="google",
                rol="estudiante",
            )
            db.add(usuario)

        db.commit()
        db.refresh(usuario)

    token = create_access_token({
        "usuario_id": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol,
    })

    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre)


@router.post("/forgot-password")
async def solicitar_recuperacion_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Genera un token de recuperación y envía el correo si el usuario existe.

    Siempre responde con el mismo mensaje genérico, exista o no la cuenta,
    para no revelar qué correos están registrados.
    """

    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()

    if usuario:
        raw_token = generate_reset_token()
        usuario.reset_password_token_hash = hash_reset_token(raw_token)
        usuario.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
        )
        db.commit()

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        send_password_reset_email(usuario.email, usuario.nombre, reset_link)

    return {
        "message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
    }


@router.post("/reset-password", response_model=TokenResponse)
async def restablecer_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Valida el token de recuperación y establece la nueva contraseña."""

    token_hash = hash_reset_token(request.token)
    usuario = (
        db.query(Usuario)
        .filter(Usuario.reset_password_token_hash == token_hash)
        .first()
    )

    expires_at = usuario.reset_password_expires_at if usuario else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not usuario or not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación es inválido o expiró. Solicita uno nuevo.",
        )

    usuario.password_hash = hash_password(request.new_password)
    usuario.reset_password_token_hash = None
    usuario.reset_password_expires_at = None
    db.commit()
    db.refresh(usuario)

    token = create_access_token({
        "usuario_id": str(usuario.id),
        "email": usuario.email,
        "rol": usuario.rol,
    })

    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre)