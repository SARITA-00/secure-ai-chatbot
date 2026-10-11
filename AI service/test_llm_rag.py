from app.llm import LLMService


ai = LLMService()

context = """
Customers can request a refund within 30 days of purchase.
Approved refunds are normally processed within 5 to 7 business days.
"""

question = "How long do I have to request a refund?"

try:
    answer = ai.send_message_with_context(
        question,
        context
    )

    print("RAG context test successful!")
    print("\nAnswer:")
    print(answer)

except Exception as error:
    print("Test failed.")
    print("Error:", error)