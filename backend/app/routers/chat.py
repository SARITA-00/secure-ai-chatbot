
import time
import threading
from collections import defaultdict, deque

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


# ==================================================
# 1. CHAT RATE LIMITING
# ==================================================

CHAT_RATE_LIMIT = 5
CHAT_RATE_WINDOW = 60

_rate_limit_lock = threading.Lock()
_request_timestamps = defaultdict(deque)


def check_chat_rate_limit(user_id: int) -> bool:
    """
    Allow at most 5 chat requests per authenticated
    user within a rolling 60-second window.
    """

    now = time.monotonic()
    cutoff = now - CHAT_RATE_WINDOW
    key = str(user_id)

    with _rate_limit_lock:
        timestamps = _request_timestamps[key]

        # Remove requests outside the time window.
        while timestamps and timestamps[0] <= cutoff:
            timestamps.popleft()

        # Reject requests once the limit is reached.
        if len(timestamps) >= CHAT_RATE_LIMIT:
            return False

        timestamps.append(now)
        return True


# ==================================================
# 2. ROUTER CONFIGURATION
# ==================================================

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# ==================================================
# 3. REQUEST AND RESPONSE MODELS
# ==================================================

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    conversation_id: int
    response: str


# ==================================================
# 4. CHAT ENDPOINT
# ==================================================

@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ----------------------------------------------
    # A. RATE LIMITING
    # ----------------------------------------------

    if not check_chat_rate_limit(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "You have sent too many chat requests. "
                "Please try again later."
            ),
            headers={
                "Retry-After": str(CHAT_RATE_WINDOW)
            },
        )

    # ----------------------------------------------
    # B. VALIDATE CONVERSATION OWNERSHIP
    # ----------------------------------------------

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

    # ----------------------------------------------
    # C. SAVE USER MESSAGE
    # ----------------------------------------------

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )

    db.add(user_message)
    db.commit()

    # ----------------------------------------------
    # D. CALL AI SERVICE
    # ----------------------------------------------

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

    # ----------------------------------------------
    # E. VALIDATE AI RESPONSE
    # ----------------------------------------------

    ai_response = ai_result.get("response")

    if not ai_response:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an invalid response",
        )

    # ----------------------------------------------
    # F. SAVE ASSISTANT RESPONSE
    # ----------------------------------------------

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response,
    )

    db.add(assistant_message)
    db.commit()

    # ----------------------------------------------
    # G. RETURN RESPONSE
    # ----------------------------------------------

    return ChatResponse(
        conversation_id=conversation.id,
        response=ai_response,
    )
