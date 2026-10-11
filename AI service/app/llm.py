import time

from google import genai
from google.genai import types

from app.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_TIMEOUT
)

from app.prompts import (
    SYSTEM_INSTRUCTION,
    RAG_INSTRUCTION
)


class LLMService:

    def __init__(self):
        self.client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(
                timeout=GEMINI_TIMEOUT
            )
        )

        self.chat = self.client.chats.create(
            model=GEMINI_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION
            )
        )

    def _is_quota_error(self, error: Exception) -> bool:
        """
        Check whether the error is caused by API quota exhaustion.
        Quota errors should NOT be retried.
        """
        error_text = str(error)

        return (
            "429" in error_text
            or "RESOURCE_EXHAUSTED" in error_text
        )

    def _is_temporary_error(self, error: Exception) -> bool:
        """
        Check whether the error is a temporary Gemini server error.
        These errors can be retried.
        """
        error_text = str(error)

        return (
            "500" in error_text
            or "503" in error_text
            or "INTERNAL" in error_text
            or "UNAVAILABLE" in error_text
        )

    def _send_with_retry(self, prompt: str) -> str:
        """
        Send a prompt to Gemini with limited retry handling.

        Temporary server errors are retried.
        Quota errors and other errors are not retried.
        """

        max_retries = 3

        for attempt in range(max_retries):

            try:
                response = self.chat.send_message(prompt)
                return response.text

            except Exception as error:

                # Do not retry quota errors.
                if self._is_quota_error(error):
                    raise error

                # Retry temporary Gemini server errors.
                if self._is_temporary_error(error):

                    if attempt == max_retries - 1:
                        raise error

                    wait_time = 2 ** attempt

                    print(
                        f"Temporary LLM error. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)
                    continue

                # Do not retry unknown errors.
                raise error

        raise RuntimeError("LLM request failed after retries.")

    def send_message(self, message: str) -> str:
        """
        Send a normal message to Gemini.
        """
        return self._send_with_retry(message)

    def send_message_with_context(
        self,
        message: str,
        context: str
    ) -> str:
        """
        Send a customer question together with
        retrieved RAG knowledge-base context.
        """

        rag_prompt = f"""
{RAG_INSTRUCTION}

KNOWLEDGE-BASE CONTEXT
----------------------
{context}
----------------------

CUSTOMER QUESTION:
{message}

ANSWER:
"""

        return self._send_with_retry(rag_prompt)