from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra una nueva organización con su primer usuario ADMIN.
    """
    return AuthService(db).register(data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario y retorna access + refresh tokens.
    """
    return AuthService(db).login(data)

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    """
    Renueva el access token usando un refresh token válido.
    """
    return AuthService(db).refresh_token(data.refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna el perfil del usuario autenticado.
    """
    return current_user