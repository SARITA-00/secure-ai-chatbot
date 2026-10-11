from app.llm import LLMService
from app.rag.retriever import retrieve_relevant_chunks
from app.guardrails import detect_prompt_injection, validate_llm_output
from app.security_logger import log_security_event

def main():

    ai = LLMService()

    print("=" * 50)
    print("       NovaCart Customer Support")
    print("=" * 50)

    print("Type 'exit' to end the conversation.")
    print()

    while True:

        question = input("Customer: ")

        if question.lower().strip() == "exit":
            print("\nChat ended. Thank you!")
            break

        if not question.strip():
            continue

        # Security guardrail
        if detect_prompt_injection(question):

            try:
                log_security_event(
                    event_type="PROMPT_INJECTION",
                    severity="HIGH",
                    description="Prompt injection attempt detected by input guardrail.",
                    action_taken="BLOCKED"
                )
            except Exception as log_error:
                print("Security event logging failed:", log_error)

            print("\nNovaCart Support:")
            print(
                "I can't help with requests to reveal "
                "system instructions or confidential information."
            )
            print()
            continue

        try:

            # Retrieve relevant knowledge from the database
            results = retrieve_relevant_chunks(
                question,
                top_k=3
            )

            # If no relevant knowledge was found,
            # do not let Gemini answer from general knowledge.
            if not results:

                response = (
                    "I don't have enough information in the "
                    "knowledge base to answer that question."
                )

            else:

                # Build context from retrieved chunks
                context_parts = []

                for result in results:
                    context_parts.append(result["content"])

                context = "\n\n---\n\n".join(context_parts)

                # Generate answer using Gemini + retrieved context
                response = ai.send_message_with_context(
                    question,
                    context
                )

                # Output security guardrail
                if not validate_llm_output(response):

                    try:
                        log_security_event(
                            event_type="UNSAFE_LLM_OUTPUT",
                            severity="HIGH",
                            description="LLM response failed output security validation.",
                            action_taken="BLOCKED"
                        )
                    except Exception as log_error:
                        print("Security event logging failed:", log_error)

                    response = (
                        "I’m sorry, but I can’t provide that response. "
                        "Please contact a support agent for assistance."
                    )

            print("\nNovaCart Support:")
            print(response)
            print()

        except Exception as error:

            error_text = str(error)

            if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
                print("\nNovaCart Support:")
                print(
                    "I'm temporarily unable to process your request. "
                    "Please try again later."
                )

            elif "503" in error_text or "UNAVAILABLE" in error_text:
                print("\nNovaCart Support:")
                print(
                    "The support service is temporarily unavailable. "
                    "Please try again in a moment."
                )

            else:
                print("\nNovaCart Support:")
                print(
                    "I'm sorry, but I couldn't process your request. "
                    "Please try again later."
                )

            print()

if __name__ == "__main__":
    main()