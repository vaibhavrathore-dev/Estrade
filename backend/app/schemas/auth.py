
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# Registration request
class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


# Registration response
class RegisterResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    user_type: str


# Login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


# Login response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
