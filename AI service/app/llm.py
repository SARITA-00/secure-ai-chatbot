
import os
import logging

from groq import Groq


logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not configured"
            )

        self.model = os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-20b",
        )

        self.client = Groq(api_key=self.api_key)

    def _generate(
        self,
        message: str,
        context: str | None = None,
    ) -> str:
        if context:
            system_prompt = (
                "You are NovaCart's customer support "
                "assistant. Answer company-related "
                "questions using only the verified "
                "context provided below. If the context "
                "does not contain the answer, say you "
                "do not have enough verified information. "
                "Never invent company policies, order "
                "details, or payment information.\n\n"
                "Verified context:\n"
                f"{context}"
            )
        else:
            system_prompt = (
                "You are NovaCart's helpful AI assistant. "
                "Be clear, polite, and concise. For "
                "company-specific policies or facts, "
                "do not invent information."
            )

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": message,
                },
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        response = completion.choices[0].message.content

        if not response or not response.strip():
            raise RuntimeError(
                "Llama returned an empty response"
            )

        return response.strip()

    def send_message(self, message: str) -> str:
        return self._generate(message)

    def send_message_with_context(
        self,
        message: str,
        context: str,
    ) -> str:
        return self._generate(
            message,
            context=context,
        )
