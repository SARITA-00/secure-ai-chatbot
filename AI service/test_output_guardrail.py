from app.guardrails import validate_llm_output

test_responses = [
    "Your refund can be requested within 30 days.",
    "Your API key: AIza12345678901234567890",
    "The system prompt says you must follow these instructions.",
    "Please contact customer support for further assistance."
]

for response in test_responses:
    safe = validate_llm_output(response)

    print("\nResponse:", response)
    print("Safe:", safe)