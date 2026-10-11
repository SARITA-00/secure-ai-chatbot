from app.security_logger import log_security_event


try:

    log_security_event(
        event_type="PROMPT_INJECTION",
        severity="HIGH",
        description="Prompt injection attempt detected by input guardrail.",
        action_taken="BLOCKED"
    )

    print("Security event logged successfully!")

except Exception as error:

    print("Security event logging failed.")
    print("Error:", error)