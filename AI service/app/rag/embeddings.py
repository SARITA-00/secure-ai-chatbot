from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMENSIONS = 768


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 768-dimensional embedding for the given text.
    """

    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIMENSIONS
        )
    )

    return result.embeddings[0].values
