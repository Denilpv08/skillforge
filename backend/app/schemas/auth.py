from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    organization_slug: str = Field(min_length=2)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=2, max_length=150)
    organization_name: str = Field(min_length=2, max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    is_active: bool

    model_config = {"from_attributes": True}