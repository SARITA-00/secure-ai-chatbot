
import logging

from app.llm import LLMService
from app.rag.retriever import retrieve_relevant_chunks


logger = logging.getLogger(__name__)

ai = LLMService()


def generate_rag_answer(query: str, top_k: int = 3) -> str:
    """
    Retrieve relevant knowledge-base chunks and generate
    a NovaCart support answer using Groq.
    """

    question = query.strip()

    if not question:
        return "Please enter a question."

    # Retrieve relevant knowledge-base chunks.
    results = retrieve_relevant_chunks(
        question,
        top_k=top_k,
    )

    if not results:
        return (
            "I could not find relevant information "
            "in the knowledge base."
        )

    # Build context from retrieved document chunks.
    context_parts = [
        result["content"]
        for result in results
        if result.get("content")
    ]

    if not context_parts:
        return (
            "I could not find relevant information "
            "in the knowledge base."
        )

    context = "\n\n---\n\n".join(context_parts)

    # Generate the answer using the existing Groq service.
    try:
        return ai.send_message_with_context(
            message=question,
            context=context,
        )

    except Exception:
        logger.exception(
            "Groq RAG answer generation failed."
        )
        raise
