from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.security_event import SecurityEvent
from app.models.user import User
from app.schemas.security_event import (
    SecurityEventCreate,
    SecurityEventResponse,
)


router = APIRouter(
    prefix="/security-events",
    tags=["Security Events"],
)


@router.post(
    "",
    response_model=SecurityEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_security_event(
    request: SecurityEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = SecurityEvent(
        user_id=current_user.id,
        conversation_id=request.conversation_id,
        event_type=request.event_type,
        severity=request.severity,
        description=request.description,
        action_taken=request.action_taken,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event