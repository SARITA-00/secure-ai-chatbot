import re


# Patterns commonly associated with prompt injection attempts.
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?prior\s+instructions",
    r"forget\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?previous\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"show\s+(me\s+)?your\s+system\s+prompt",
    r"reveal\s+(your\s+)?instructions",
    r"show\s+(me\s+)?your\s+instructions",
    r"reveal\s+your\s+api\s+key",
    r"show\s+(me\s+)?your\s+api\s+key",
    r"reveal\s+.*password",
    r"developer\s+message",
    r"system\s+message",
    r"jailbreak",
]


def detect_prompt_injection(message: str) -> bool:
    """
    Detect common prompt-injection or jailbreak patterns.

    Returns True when a suspicious pattern is detected.
    """

    normalized_message = message.lower().strip()

    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, normalized_message):
            return True

    return False

def validate_llm_output(response: str) -> bool:
    """
    Check whether an LLM response appears to contain
    sensitive information or internal instructions.

    Returns:
        True  -> response is safe
        False -> response should be blocked
    """

    sensitive_patterns = [
        r"AIza[0-9A-Za-z_-]{20,}",       # Google API key pattern
        r"api[_\s-]?key\s*[:=]",
        r"password\s*[:=]",
        r"secret\s*[:=]",
        r"system\s+prompt",
        r"system\s+instruction",
        r"developer\s+message",
    ]

    for pattern in sensitive_patterns:
        if re.search(pattern, response, re.IGNORECASE):
            return False

    return True