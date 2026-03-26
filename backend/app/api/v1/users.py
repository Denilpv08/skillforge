from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserOut
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/users", tags=["Users"])

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None

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