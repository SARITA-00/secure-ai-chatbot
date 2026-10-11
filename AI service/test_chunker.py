from app.rag.loader import load_pdf
from app.rag.chunker import chunk_text


pdf_path = "data/sample_customer_support_policy.pdf"

try:
    text = load_pdf(pdf_path)
    chunks = chunk_text(text)

    print("Chunking successful!")
    print("Number of chunks:", len(chunks))

    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i + 1} ---")
        print(chunk)

except Exception as error:
    print("Chunking failed.")
    print("Error:", error)