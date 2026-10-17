from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RegistrationFieldCreate(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    field_type: str = "text"
    required: bool = False
    options: list[str] | None = None
    position: int = Field(default=0, ge=0)


class RegistrationAnswerInput(BaseModel):
    field_id: UUID
    value: Any


class EventRegistrationCreate(BaseModel):
    certificate_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    answers: list[RegistrationAnswerInput] = Field(default_factory=list)


class CheckInRequest(BaseModel):
    token: str = Field(min_length=20)
