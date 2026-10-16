import os
import re
import logging
import time
import threading
from collections import defaultdict, deque

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from app.llm import LLMService
from app.rag.retriever import retrieve_relevant_chunks
from app.guardrails import (
    detect_prompt_injection,
    validate_llm_output,
)
from app.security_logger import log_security_event


# ==================================================
# 1. CONFIGURATION
# ==================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

load_dotenv()

AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")

if not AI_SERVICE_API_KEY:
    raise RuntimeError(
        "AI_SERVICE_API_KEY is not configured"
    )


# ==================================================
# 2. RATE LIMITING CONFIGURATION
# ==================================================

CHAT_RATE_LIMIT = int(
    os.getenv("CHAT_RATE_LIMIT", "5")
)

CHAT_RATE_WINDOW = int(
    os.getenv("CHAT_RATE_WINDOW", "60")
)

if CHAT_RATE_LIMIT < 1 or CHAT_RATE_WINDOW < 1:
    raise ValueError(
        "CHAT_RATE_LIMIT and CHAT_RATE_WINDOW must be positive integers"
    )

_rate_limit_lock = threading.Lock()
_request_timestamps = defaultdict(deque)


def check_chat_rate_limit(user_id: int | None) -> bool:
    """
    Allow at most CHAT_RATE_LIMIT requests per user
    within CHAT_RATE_WINDOW seconds.
    """

    if user_id is None:
        return False

    now = time.monotonic()
    cutoff = now - CHAT_RATE_WINDOW
    key = str(user_id)

    with _rate_limit_lock:
        timestamps = _request_timestamps[key]

        while timestamps and timestamps[0] <= cutoff:
            timestamps.popleft()

        if len(timestamps) >= CHAT_RATE_LIMIT:
            return False

        timestamps.append(now)
        return True


# ==================================================
# 3. FASTAPI
# ==================================================

app = FastAPI(
    title="NovaCart AI Service",
    version="2.0.0",
)


# ==================================================
# 4. MODELS
# ==================================================

class ChatRequest(BaseModel):
    message: str
    user_id: int | None = None
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    response: str


# ==================================================
# 5. INITIALIZE GEMINI
# ==================================================

ai = LLMService()


# ==================================================
# 6. GREETINGS
# ==================================================

def handle_greeting(message: str) -> str | None:
    normalized = re.sub(
        r"[^\w\s']",
        " ",
        message.lower(),
    )

    normalized = " ".join(normalized.split())

    greetings = {
        "hi",
        "hello",
        "hey",
        "hiya",
        "good morning",
        "good afternoon",
        "good evening",
    }

    if normalized in greetings:
        return (
            "Hello! Welcome to NovaCart Support. "
            "How can I help you today?"
        )

    return None


# ==================================================
# 7. SECURITY LOGGING
# ==================================================

def safe_log_security_event(**kwargs):
    try:
        log_security_event(**kwargs)
    except Exception:
        logger.exception(
            "Failed to write security event."
        )


# ==================================================
# 8. COMPANY-RELATED QUESTION DETECTION
# ==================================================

COMPANY_KEYWORDS = (
    "novacart",
    "return policy",
    "return a product",
    "return my product",
    "refund",
    "exchange",
    "shipping",
    "delivery",
    "payment method",
    "payment methods",
    "order status",
    "track my order",
    "where is my order",
    "cancel my order",
    "cancellation policy",
    "warranty",
    "customer support policy",
    "privacy policy",
    "terms and conditions",
    "my account",
    "my purchase",
    "my payment",
    "my refund",
)


def needs_company_context(message: str) -> bool:
    normalized = message.lower()

    return any(
        keyword in normalized
        for keyword in COMPANY_KEYWORDS
    )


# ==================================================
# 9. HEALTH CHECK
# ==================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NovaCart AI Service",
    }


# ==================================================
# 10. CHAT ENDPOINT
# ==================================================

@app.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    x_ai_service_key: str | None = Header(
        default=None,
    ),
):
    # ----------------------------------------------
    # A. AUTHENTICATION
    # ----------------------------------------------

    if (
        not AI_SERVICE_API_KEY
        or x_ai_service_key != AI_SERVICE_API_KEY
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized AI service request",
        )

    # ----------------------------------------------
    # B. RATE LIMITING
    # ----------------------------------------------

    if not check_chat_rate_limit(request.user_id):
        logger.warning(
            "Chat rate limit exceeded. user_id=%s",
            request.user_id,
        )

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Chat rate limit exceeded. "
                "Please try again later."
            ),
            headers={
                "Retry-After": str(CHAT_RATE_WINDOW)
            },
        )

    question = request.message.strip()

    if not question:
        return ChatResponse(
            response="Please enter a message."
        )

    logger.info(
        "Processing chat request. "
        "user_id=%s conversation_id=%s",
        request.user_id,
        request.conversation_id,
    )

    # ----------------------------------------------
    # C. INPUT GUARDRAIL
    # ----------------------------------------------

    try:
        injection_detected = detect_prompt_injection(
            question
        )

    except Exception:
        logger.exception(
            "Input security validation failed."
        )

        safe_log_security_event(
            event_type="INPUT_GUARDRAIL_ERROR",
            severity="HIGH",
            description=(
                "Input security validation failed."
            ),
            action_taken="BLOCKED",
            user_id=request.user_id,
            conversation_id=request.conversation_id,
        )

        return ChatResponse(
            response=(
                "I'm temporarily unable to process "
                "your message safely. Please try again."
            )
        )

    if injection_detected:
        safe_log_security_event(
            event_type="PROMPT_INJECTION",
            severity="HIGH",
            description=(
                "Potential prompt injection detected."
            ),
            action_taken="BLOCKED",
            user_id=request.user_id,
            conversation_id=request.conversation_id,
        )

        return ChatResponse(
            response=(
                "I can't help reveal confidential "
                "instructions or private information."
            )
        )

    # ----------------------------------------------
    # D. HANDLE SIMPLE GREETINGS
    # ----------------------------------------------

    greeting = handle_greeting(question)

    if greeting is not None:
        return ChatResponse(response=greeting)

    # ----------------------------------------------
    # E. RETRIEVE CONTEXT ONLY WHEN NEEDED
    # ----------------------------------------------

    company_question = needs_company_context(question)
    context = ""

    if company_question:
        try:
            results = retrieve_relevant_chunks(
                question,
                top_k=3,
            )

            context_parts = []

            for result in results or []:
                content = result.get("content")

                if (
                    isinstance(content, str)
                    and content.strip()
                ):
                    context_parts.append(content.strip())

            context = "\n\n---\n\n".join(
                context_parts
            )

            logger.info(
                "Knowledge-base retrieval completed. "
                "chunks=%s",
                len(context_parts),
            )

        except Exception:
            logger.exception(
                "Knowledge-base retrieval failed."
            )

            context = ""

    # ----------------------------------------------
    # F. DO NOT INVENT MISSING COMPANY FACTS
    # ----------------------------------------------

    if company_question and not context:
        return ChatResponse(
            response=(
                "I couldn't find enough verified "
                "NovaCart information to answer that "
                "question. Please contact a support "
                "agent for assistance."
            )
        )

    # ----------------------------------------------
    # G. CALL GEMINI
    # ----------------------------------------------

    try:
        if company_question:
            response = ai.send_message_with_context(
                question,
                context,
            )
        else:
            response = ai.send_message(question)

        if (
            not isinstance(response, str)
            or not response.strip()
        ):
            logger.error(
                "Gemini returned an empty response."
            )

            return ChatResponse(
                response=(
                    "I couldn't generate a response. "
                    "Please try again."
                )
            )

        response = response.strip()

    except Exception as error:
        logger.exception(
            "Gemini response generation failed. "
            "error_type=%s",
            type(error).__name__,
        )

        error_text = str(error).upper()

        if (
            "429" in error_text
            or "RESOURCE_EXHAUSTED" in error_text
        ):
            return ChatResponse(
                response=(
                    "The AI service has reached its "
                    "current usage limit. Please try "
                    "again later."
                )
            )

        if (
            "503" in error_text
            or "UNAVAILABLE" in error_text
        ):
            return ChatResponse(
                response=(
                    "The AI service is temporarily "
                    "unavailable. Please try again."
                )
            )

        return ChatResponse(
            response=(
                "I'm sorry, I couldn't process your "
                "message. Please try again."
            )
        )

    # ----------------------------------------------
    # H. OUTPUT VALIDATION
    # ----------------------------------------------

    try:
        valid_output = validate_llm_output(response)

    except Exception:
        logger.exception(
            "Output security validation failed."
        )

        valid_output = False

    if not valid_output:
        safe_log_security_event(
            event_type="UNSAFE_LLM_OUTPUT",
            severity="HIGH",
            description=(
                "AI response failed output validation."
            ),
            action_taken="BLOCKED",
            user_id=request.user_id,
            conversation_id=request.conversation_id,
        )

        return ChatResponse(
            response=(
                "I'm sorry, but I can't provide "
                "that response."
            )
        )

    # ----------------------------------------------
    # I. RETURN RESPONSE
    # ----------------------------------------------

    return ChatResponse(response=response)
