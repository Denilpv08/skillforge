from fastapi import APIRouter, Depends, Request, Cookie, Response
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.dependencies import get_db, get_current_user
from app.core.rate_limit import limiter
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
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra una nueva organización con su primer usuario ADMIN.
    Rate limit: 5 registros por minuto por IP.
    """
    tokens = AuthService(db).register(data)
    response = Response(content=tokens.model_dump_json(), media_type="application/json")
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario y retorna access + refresh tokens.
    Rate limit: 10 intentos de login por minuto por IP.
    El refresh token se guarda en una cookie httpOnly para mayor seguridad.
    """
    tokens = AuthService(db).login(data)
    response = Response(content=tokens.model_dump_json(), media_type="application/json")
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response

@router.post("/refresh", response_model=TokenResponse)
def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
):
    """
    Renueva el access token usando el refresh token de la cookie httpOnly.
    """
    if not refresh_token:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    
    tokens = AuthService(db).refresh_token(refresh_token)
    response.delete_cookie("refresh_token")
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response

@router.post("/logout")
def logout(response: Response):
    """
    Cierra la sesión del usuario eliminando la cookie de refresh token.
    """
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna el perfil del usuario autenticado.
    """
    return current_user