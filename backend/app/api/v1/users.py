from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserCreate
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    role: UserRole = UserRole.STUDENT

class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None

# ─── Perfil propio ────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserOut)
def update_my_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    return repo.update(current_user)

# ─── Gestión de usuarios (solo ADMIN+) ───────────────────────
@router.get(
    "",
    response_model=list[UserOut],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los usuarios de la organización."""
    return UserRepository(db).get_by_org(current_user.organization_id)

@router.post(
    "",
    response_model=UserOut,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def create_user(
    data: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un usuario dentro de la misma organización."""
    repo = UserRepository(db)

    # Verificar email único en la org
    existing = repo.get_by_email_and_org(data.email, current_user.organization_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered in this organization",
        )

    # ADMIN no puede crear SUPER_ADMIN
    if (
        data.role == UserRole.SUPER_ADMIN
        and current_user.role != UserRole.SUPER_ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can create SUPER_ADMIN users",
        )

    user = User(
        organization_id=current_user.organization_id,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    return repo.create(user)

@router.patch(
    "/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def update_user(
    user_id: str,
    data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza rol o estado de un usuario de la misma org."""
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)

    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own role or status",
        )

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active

    return repo.update(user)