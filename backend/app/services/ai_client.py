import os

import requests
from dotenv import load_dotenv

load_dotenv()

AI_SERVICE_URL = os.getenv(
    "AI_SERVICE_URL",
    "http://127.0.0.1:8001",
)

AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")

if not AI_SERVICE_API_KEY:
    raise RuntimeError(
        "AI_SERVICE_API_KEY is not configured"
    )


def send_to_ai(
    message: str,
    user_id: int,
    conversation_id: int | None = None,
) -> dict:
    response = requests.post(
        f"{AI_SERVICE_URL}/chat",
        headers={
            "X-AI-Service-Key": AI_SERVICE_API_KEY
        },
        json={
            "message": message,
            "user_id": user_id,
            "conversation_id": conversation_id,
        },
        timeout=60,
    )

    response.raise_for_status()

    return response.json()