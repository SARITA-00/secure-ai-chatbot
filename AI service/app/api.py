import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header
from pydantic import BaseModel

from app.llm import LLMService
from app.rag.retriever import retrieve_relevant_chunks
from app.guardrails import (
    detect_prompt_injection,
    validate_llm_output,
)
from app.security_logger import log_security_event


load_dotenv()

AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")

if not AI_SERVICE_API_KEY:
    raise RuntimeError("AI_SERVICE_API_KEY is not configured")


app = FastAPI(
    title="NovaCart AI Service",
    version="1.0.0",
)


class ChatRequest(BaseModel):
    message: str
    user_id: int | None = None
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    response: str


ai = LLMService()


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NovaCart AI Service",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    x_ai_service_key: str | None = Header(default=None),
):
    # -----------------------------
    # INTERNAL SERVICE AUTHENTICATION
    # -----------------------------

    if x_ai_service_key != AI_SERVICE_API_KEY:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized AI service request",
        )

    question = request.message.strip()

    if not question:
        return ChatResponse(
            response="Please enter a message."
        )

    # -----------------------------
    # INPUT SECURITY
    # -----------------------------

    if detect_prompt_injection(question):

        try:
            log_security_event(
                event_type="PROMPT_INJECTION",
                severity="HIGH",
                description=(
                    "Prompt injection attempt detected "
                    "by input guardrail."
                ),
                action_taken="BLOCKED",
                user_id=request.user_id,
                conversation_id=request.conversation_id,
            )
        except Exception:
            pass

        return ChatResponse(
            response=(
                "I can't help with requests to reveal "
                "system instructions or confidential information."
            )
        )

    # -----------------------------
    # RAG RETRIEVAL
    # -----------------------------

    results = retrieve_relevant_chunks(
        question,
        top_k=3,
    )

    if not results:
        return ChatResponse(
            response=(
                "I don't have enough information in "
                "the knowledge base to answer that question."
            )
        )

    context_parts = []

    for result in results:
        context_parts.append(
            result["content"]
        )

    context = "\n\n---\n\n".join(
        context_parts
    )

    # -----------------------------
    # LLM
    # -----------------------------

    try:
        response = ai.send_message_with_context(
            question,
            context,
        )

    except Exception as error:

        error_text = str(error)

        if (
            "429" in error_text
            or "RESOURCE_EXHAUSTED" in error_text
        ):
            return ChatResponse(
                response=(
                    "I'm temporarily unable to process "
                    "your request. Please try again later."
                )
            )

        if (
            "503" in error_text
            or "UNAVAILABLE" in error_text
        ):
            return ChatResponse(
                response=(
                    "The support service is temporarily "
                    "unavailable. Please try again."
                )
            )

        return ChatResponse(
            response=(
                "I'm sorry, but I couldn't process "
                "your request."
            )
        )

    # -----------------------------
    # OUTPUT SECURITY
    # -----------------------------

    if not validate_llm_output(response):

        try:
            log_security_event(
                event_type="UNSAFE_LLM_OUTPUT",
                severity="HIGH",
                description=(
                    "LLM response failed output "
                    "security validation."
                ),
                action_taken="BLOCKED",
                user_id=request.user_id,
                conversation_id=request.conversation_id,
            )
        except Exception:
            pass

        return ChatResponse(
            response=(
                "I'm sorry, but I can't provide "
                "that response."
            )
        )

    # -----------------------------
    # SUCCESS
    # -----------------------------

    return ChatResponse(
        response=response
    )