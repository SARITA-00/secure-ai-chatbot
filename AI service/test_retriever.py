from app.rag.retriever import retrieve_relevant_chunks


query = "How long do I have to request a refund?"

try:
    results = retrieve_relevant_chunks(query, top_k=2)

    print("Retrieval successful!")
    print("Number of results:", len(results))

    for i, result in enumerate(results):

        print(f"\n--- Result {i + 1} ---")
        print("Document ID:", result["document_id"])
        print("Chunk:", result["chunk_index"])
        print("Distance:", result["distance"])
        print("Content:")
        print(result["content"])

except Exception as error:
    print("Retrieval failed.")
    print("Error:", error)

