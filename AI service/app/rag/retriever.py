from app.rag.database import get_connection
from app.rag.embeddings import generate_embedding


def retrieve_relevant_chunks(
    query: str,
    top_k: int = 3,
    max_distance: float = 0.30
) -> list[dict]:
    """
    Retrieve relevant document chunks using vector similarity.

    Smaller cosine distance means greater similarity.
    """

    query_embedding = generate_embedding(query)

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                document_id,
                chunk_index,
                content,
                embedding <=> %s::vector AS distance
            FROM document_chunks
            WHERE embedding <=> %s::vector <= %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s;
            """,
            (
                query_embedding,
                query_embedding,
                max_distance,
                query_embedding,
                top_k
            )
        )

        rows = cursor.fetchall()

        results = []

        for row in rows:
            results.append({
                "id": row[0],
                "document_id": row[1],
                "chunk_index": row[2],
                "content": row[3],
                "distance": row[4]
            })

        return results

    finally:
        connection.close()