from app.rag.database import get_connection
from app.rag.loader import load_pdf
from app.rag.chunker import chunk_text
from app.rag.embeddings import generate_embedding


def ingest_pdf(
    file_path: str,
    title: str,
    filename: str,
    document_type: str = "pdf",
    source: str = "local"
):
    # 1. Extract text from PDF
    text = load_pdf(file_path)

    # 2. Split text into chunks
    chunks = chunk_text(text)

    if not chunks:
        raise ValueError("No text was extracted from the document.")

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # 3. Insert document
        cursor.execute(
            """
            INSERT INTO documents
                (title, filename, document_type, source,
                 created_at, updated_at)
            VALUES
                (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id;
            """,
            (title, filename, document_type, source)
        )

        # Get the ID of the document we just inserted
        document_id = cursor.fetchone()[0]

        print("Document ID:", document_id)

        # 4. Generate embeddings and store chunks
        for index, chunk in enumerate(chunks):

            embedding = generate_embedding(chunk)

            cursor.execute(
                """
                INSERT INTO document_chunks
                    (document_id, chunk_index, content,
                     embedding, created_at)
                VALUES
                    (%s, %s, %s, %s, CURRENT_TIMESTAMP);
                """,
                (
                    document_id,
                    index,
                    chunk,
                    embedding
                )
            )

            print(f"Stored chunk {index + 1}/{len(chunks)}")

        # 5. Save everything
        connection.commit()

        print("\nDocument ingestion successful!")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()