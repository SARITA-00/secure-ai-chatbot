from google import genai

from app.config import GEMINI_API_KEY
from app.rag.retriever import retrieve_relevant_chunks


client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.6-flash"


def generate_rag_answer(query: str, top_k: int = 3) -> str:
    """
    Retrieve relevant knowledge and generate an answer using Gemini.
    """

    results = retrieve_relevant_chunks(query, top_k=top_k)

    if not results:
        return "I could not find relevant information in the knowledge base."

    context_parts = []

    for result in results:
        context_parts.append(result["content"])

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""
You are a customer-support assistant.

Answer the user's question using ONLY the information
provided in the knowledge base below.

If the answer cannot be found in the knowledge base,
say that you do not have enough information.

Do not invent or assume information.

KNOWLEDGE BASE:
{context}

USER QUESTION:
{query}

ANSWER:
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    return response.text