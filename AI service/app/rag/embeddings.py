
from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 384

model = SentenceTransformer(EMBEDDING_MODEL)


def generate_embedding(text: str) -> list[float]:
    """Generate a local 384-dimensional text embedding."""
    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )
    return embedding.tolist()
