from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str


class TokenData(BaseModel):
    usuario_id: str
    email: str
    rol: str