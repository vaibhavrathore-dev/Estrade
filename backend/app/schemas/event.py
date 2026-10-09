
from datetime import datetime
from typing import Literal, Self
from uuid import UUID

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None

    committee_id: UUID
    venue_id: UUID

    starts_at: AwareDatetime
    ends_at: AwareDatetime

    max_participants: int | None = Field(default=None, gt=0)
    status: Literal["draft", "confirmed"] = "draft"

    @model_validator(mode="after")
    def validate_times(self) -> Self:
        if self.ends_at <= self.starts_at:
            raise ValueError(
                "Event end time must be after start time"
            )
        return self


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None

    committee_id: UUID
    venue_id: UUID
    created_by: UUID

    starts_at: datetime
    ends_at: datetime

    status: str
    is_published: bool
    max_participants: int | None
    created_at: datetime

