from app.rag.embeddings import generate_embedding


text = "Customers can request a refund within 30 days of purchase."

try:
    embedding = generate_embedding(text)

    print("Embedding generated successfully!")
    print("Dimensions:", len(embedding))
    print("First 5 values:", embedding[:5])

except Exception as error:
    print("Embedding generation failed.")
    print("Error:", error)