from datetime import datetime

from pydantic import BaseModel, Field


class AuditLogCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=50)
    resource_type: str | None = Field(
        default=None,
        max_length=50,
    )
    resource_id: str | None = Field(
        default=None,
        max_length=100,
    )
    details: str | None = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    event_type: str
    resource_type: str | None
    resource_id: str | None
    details: str | None
    ip_address: str | None
    created_at: datetime