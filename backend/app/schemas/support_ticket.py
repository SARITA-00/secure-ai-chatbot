from datetime import datetime

from pydantic import BaseModel, Field


class SupportTicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")


class SupportTicketResponse(BaseModel):
    id: int
    user_id: int
    assigned_agent_id: int | None
    subject: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime


class SupportTicketUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        pattern="^(OPEN|IN_PROGRESS|RESOLVED|CLOSED)$",
    )
    priority: str | None = Field(
        default=None,
        pattern="^(LOW|MEDIUM|HIGH)$",
    )
    assigned_agent_id: int | None = None