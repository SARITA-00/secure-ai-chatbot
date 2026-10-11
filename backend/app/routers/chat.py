from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.services.ai_client import send_to_ai

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    conversation_id: int
    response: str


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.conversation_id is not None:
        conversation = db.scalar(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.message[:50],
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )

    db.add(user_message)
    db.commit()

    try:
        ai_result = send_to_ai(
            message=request.message,
            user_id=current_user.id,
            conversation_id=conversation.id,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is currently unavailable",
        )

    ai_response = ai_result.get("response")

    if not ai_response:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response",
        )

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response,
    )

    db.add(assistant_message)
    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        response=ai_response,
    )