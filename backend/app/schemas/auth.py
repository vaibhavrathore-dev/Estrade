
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# Registration request
class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator('full_name', mode='before')
    @classmethod
    def clean_name(cls, value):
        return value.strip() if isinstance(value, str) else value


# Registration response
class RegisterResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    user_type: str


# Login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# Login response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
