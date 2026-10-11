from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


router = APIRouter(prefix="/conversations", tags=["Conversations"])


class ConversationSummary(BaseModel):
    id: int
    title: str | None
    preview: str
    created_at: datetime
    last_activity_at: datetime


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


@router.get("", response_model=list[ConversationSummary])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The current user's conversations, most recently active first."""
    last_activity = func.max(Message.created_at).label("last_activity_at")

    rows = db.execute(
        select(Conversation, last_activity)
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(last_activity.desc().nulls_last(), Conversation.id.desc())
    ).all()

    summaries: list[ConversationSummary] = []

    for conversation, last_at in rows:
        first_user_message = db.scalar(
            select(Message.content)
            .where(
                Message.conversation_id == conversation.id,
                Message.role == "user",
            )
            .order_by(Message.id.asc())
            .limit(1)
        )

        summaries.append(
            ConversationSummary(
                id=conversation.id,
                title=conversation.title,
                preview=(first_user_message or "")[:140],
                created_at=conversation.created_at,
                last_activity_at=last_at or conversation.created_at,
            )
        )

    return summaries


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Messages of one conversation. Only the owner can read it."""
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.id.asc())
    ).all()
