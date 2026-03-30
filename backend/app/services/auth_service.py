from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.exc import IntegrityError
import time

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
from app.core.utils import slugify
from app.core.rate_limit import logger
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

class AuthService:
    """
    Lógica de negocio para autenticación.
    Orchestra repositories y utilidades de seguridad.
    """

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.org_repo = OrganizationRepository(db)

    def register(self, data: RegisterRequest) -> TokenResponse:
        slug = slugify(data.organization_name)
        logger.info("registration_attempt", org_slug=slug, email=data.email)

        if self.org_repo.get_by_slug(slug):
            logger.warning("registration_failed_org_exists", org_slug=slug)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Organization already exists. "
                    f"Try another name or login with organization slug: {slug}"
                ),
            )

        try:
            org = Organization(name=data.organization_name, slug=slug)
            self.org_repo.db.add(org)
            self.org_repo.db.flush()

            user = User(
                organization_id=org.id,
                email=data.email,
                password_hash=hash_password(data.password),
                full_name=data.full_name,
                role=UserRole.ADMIN,
            )
            self.org_repo.db.add(user)

            self.org_repo.db.commit()
            self.org_repo.db.refresh(user)
            logger.info("registration_success", user_id=user.id, org_id=org.id)
        except IntegrityError:
            self.org_repo.db.rollback()
            logger.error("registration_failed_integrity", org_slug=slug)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Could not register due to duplicated organization or user data",
            )

        return self._build_token_response(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        org = self.org_repo.get_by_slug(data.organization_slug)
        
        if not org or not self._verify_with_timing(data.password, "" if not org else ""):
            time.sleep(0.05)
            logger.warning("login_failed", org_slug=data.organization_slug, email=data.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        user = self.user_repo.get_by_email_and_org(data.email, org.id)
        
        if not user or not self._verify_with_timing(data.password, user.password_hash or ""):
            time.sleep(0.05)
            logger.warning("login_failed", org_slug=data.organization_slug, email=data.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        logger.info("login_success", user_id=user.id, org_id=org.id)
        return self._build_token_response(user)

    def _verify_with_timing(self, password: str, hashed: str | None) -> bool:
        if not hashed:
            return False
        try:
            return verify_password(password, hashed)
        except Exception:
            return False

    def refresh_token(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                logger.warning("refresh_token_invalid_type")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id: str = payload.get("sub")
        except JWTError as e:
            logger.warning("refresh_token_failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            logger.warning("refresh_token_user_invalid", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        logger.info("refresh_token_success", user_id=user.id)
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