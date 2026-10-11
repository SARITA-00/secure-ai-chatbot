from app.rag.database import get_connection


def log_security_event(
    event_type: str,
    severity: str,
    description: str,
    action_taken: str,
    user_id: int | None = None,
    conversation_id: int | None = None,
):
    """
    Store a security-related event in PostgreSQL.
    """

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO security_events
                (
                    user_id,
                    conversation_id,
                    event_type,
                    severity,
                    description,
                    action_taken,
                    created_at
                )
            VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP
                );
            """,
            (
                user_id,
                conversation_id,
                event_type,
                severity,
                description,
                action_taken,
            )
        )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()