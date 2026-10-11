from app.rag.database import get_connection

connection = get_connection()

try:
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            event_type,
            severity,
            description,
            action_taken,
            created_at
        FROM security_events
        ORDER BY created_at DESC
        LIMIT 10;
    """)

    rows = cursor.fetchall()

    print("\n--- Logged Security Events ---")

    if not rows:
        print("No security events found.")

    for row in rows:
        print("\nID:", row[0])
        print("Event:", row[1])
        print("Severity:", row[2])
        print("Description:", row[3])
        print("Action:", row[4])
        print("Created:", row[5])

finally:
    connection.close()