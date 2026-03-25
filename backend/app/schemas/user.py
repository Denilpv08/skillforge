from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=150)
    role: UserRole = UserRole.STUDENT
    organization_id: str

class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    avatar_url: str | None = None
    is_active: bool | None = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    organization_id: str
    avatar_url: str | None
    is_active: bool

    model_config = {"from_attributes": True}