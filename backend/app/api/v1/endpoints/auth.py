from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.usuario import Usuario
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
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
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Autentica un usuario y retorna un JWT."""

    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()

    if not usuario or not verify_password(request.password, usuario.password_hash):
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


@router.get("/me")
async def get_me(db: Session = Depends(get_db)):
    """Endpoint temporal para verificar que el router funciona."""
    return {"message": "Auth router funcionando"}