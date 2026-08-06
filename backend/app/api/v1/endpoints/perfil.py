from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.models.perfil_usuario import PerfilUsuario
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.categoria_tecnologia import CategoriaTecnologia
from app.schemas.perfil import PerfilCreate, PerfilUpdate, PerfilResponse

router = APIRouter()


def obtener_perfil_con_categorias(db: Session, perfil_id: UUID) -> PerfilUsuario:
    """Helper que carga el perfil con todas sus relaciones."""
    return db.query(PerfilUsuario).options(
        joinedload(PerfilUsuario.tecnologias).joinedload(PerfilTecnologia.categoria)
    ).filter(PerfilUsuario.id == perfil_id).first()


@router.get("/categorias")
async def obtener_categorias(db: Session = Depends(get_db)):
    """Retorna todas las categorías tecnológicas disponibles."""
    return db.query(CategoriaTecnologia).all()


@router.post("/", response_model=PerfilResponse, status_code=status.HTTP_201_CREATED)
async def crear_perfil(
    request: PerfilCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea el perfil tecnológico del estudiante."""
    existing = db.query(PerfilUsuario).filter(
        PerfilUsuario.usuario_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya tiene un perfil. Usa PATCH para actualizarlo.",
        )

    categorias = db.query(CategoriaTecnologia).filter(
        CategoriaTecnologia.id.in_(request.categorias_ids)
    ).all()
    if len(categorias) != len(request.categorias_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una o más categorías no existen.",
        )

    perfil = PerfilUsuario(
        usuario_id=current_user.id,
        meta_profesional=request.meta_profesional,
        nivel_actual=request.nivel_actual,
    )
    db.add(perfil)
    db.flush()

    for categoria in categorias:
        pt = PerfilTecnologia(perfil_id=perfil.id, categoria_id=categoria.id)
        db.add(pt)

    db.commit()
    return obtener_perfil_con_categorias(db, perfil.id)


@router.get("/", response_model=PerfilResponse)
async def obtener_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna el perfil tecnológico del usuario autenticado."""
    perfil = db.query(PerfilUsuario).filter(
        PerfilUsuario.usuario_id == current_user.id
    ).first()
    if not perfil:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene perfil. Completa el skill assessment primero.",
        )
    return obtener_perfil_con_categorias(db, perfil.id)


@router.patch("/", response_model=PerfilResponse)
async def actualizar_perfil(
    request: PerfilUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el perfil tecnológico del usuario autenticado."""
    perfil = db.query(PerfilUsuario).filter(
        PerfilUsuario.usuario_id == current_user.id
    ).first()
    if not perfil:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene perfil. Crea uno primero.",
        )

    if request.meta_profesional is not None:
        perfil.meta_profesional = request.meta_profesional
    if request.nivel_actual is not None:
        perfil.nivel_actual = request.nivel_actual

    if request.categorias_ids is not None:
        categorias = db.query(CategoriaTecnologia).filter(
            CategoriaTecnologia.id.in_(request.categorias_ids)
        ).all()
        if len(categorias) != len(request.categorias_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Una o más categorías no existen.",
            )
        db.query(PerfilTecnologia).filter(
            PerfilTecnologia.perfil_id == perfil.id
        ).delete()
        for categoria in categorias:
            pt = PerfilTecnologia(perfil_id=perfil.id, categoria_id=categoria.id)
            db.add(pt)

    db.commit()
    return obtener_perfil_con_categorias(db, perfil.id)