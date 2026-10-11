from datetime import datetime

from pydantic import BaseModel, Field


class SecurityEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=50)
    severity: str = Field(min_length=1, max_length=20)
    description: str | None = None
    action_taken: str = Field(min_length=1, max_length=50)
    conversation_id: int | None = None


class SecurityEventResponse(BaseModel):
    id: int
    user_id: int | None
    conversation_id: int | None
    event_type: str
    severity: str
    description: str | None
    action_taken: str
    created_at: datetime