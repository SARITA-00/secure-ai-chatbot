from app.rag.database import get_connection

try:
    connection = get_connection()
    cursor = connection.cursor()

    for table_name in ["documents", "document_chunks"]:

        print(f"\n--- {table_name} ---")

        cursor.execute("""
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))

        columns = cursor.fetchall()

        for column in columns:
            print(f"- {column[0]} : {column[1]}")

    cursor.close()
    connection.close()

except Exception as error:
    print("Error:", error)