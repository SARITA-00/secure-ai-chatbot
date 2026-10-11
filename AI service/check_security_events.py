from app.rag.database import get_connection


try:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'security_events'
        ORDER BY ordinal_position;
    """)

    columns = cursor.fetchall()

    print("\n--- security_events ---")

    for column in columns:
        print(
            f"- {column[0]} : "
            f"{column[1]} "
            f"(nullable: {column[2]})"
        )

    cursor.close()
    connection.close()

except Exception as error:
    print("Error:", error)