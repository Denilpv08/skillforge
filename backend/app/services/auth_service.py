from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import JWTError
import re

from app.models.user import User, UserRole
from app.models.organization import Organization
from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationRepository
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

class AuthService:
    """
    Lógica de negocio para autenticación.
    Orquesta repositories y utilidades de seguridad.
    """

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.org_repo = OrganizationRepository(db)

    def register(self, data: RegisterRequest) -> TokenResponse:
        slug = self._generate_slug(data.organization_name)

        if self.org_repo.get_by_slug(slug):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Organization name already taken",
            )

        # Crear organización SIN commit todavía
        org = Organization(name=data.organization_name, slug=slug)
        self.org_repo.db.add(org)
        self.org_repo.db.flush()  # ← genera el ID sin hacer commit

        # Crear usuario SIN commit todavía
        user = User(
            organization_id=org.id,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=UserRole.ADMIN,
        )
        self.org_repo.db.add(user)

        # Un solo commit atómico — si algo falla, NADA se guarda
        self.org_repo.db.commit()
        self.org_repo.db.refresh(user)

        return self._build_token_response(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        # Buscar organización
        org = self.org_repo.get_by_slug(data.organization_slug)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Buscar usuario
        user = self.user_repo.get_by_email_and_org(data.email, org.id)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        return self._build_token_response(user)

    def refresh_token(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id: str = payload.get("sub")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        return self._build_token_response(user)

    def _build_token_response(self, user: User) -> TokenResponse:
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value,
            "org_id": user.organization_id,
        }
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    @staticmethod
    def _generate_slug(name: str) -> str:
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_-]+", "-", slug)
        return slug.strip("-")