from app.rag.generator import generate_rag_answer


questions = [
    "How long do I have to request a refund?",
    "What does the warranty cover?",
    "How long does standard shipping take?"
    "What is your company's phone number?"
]

for question in questions:

    print("\n" + "=" * 60)
    print("QUESTION:", question)
    print("=" * 60)

    try:
        answer = generate_rag_answer(question)

        print("ANSWER:")
        print(answer)

    except Exception as error:
        print("RAG failed.")
        print("Error:", error)