from app.rag.database import get_connection

try:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            a.attname AS column_name,
            format_type(a.atttypid, a.atttypmod) AS data_type
        FROM pg_attribute a
        JOIN pg_class c
            ON a.attrelid = c.oid
        JOIN pg_namespace n
            ON c.relnamespace = n.oid
        WHERE c.relname = 'document_chunks'
          AND a.attname = 'embedding'
          AND n.nspname = 'public';
    """)

    result = cursor.fetchone()

    print("Embedding column:")
    print(result)

    cursor.close()
    connection.close()

except Exception as error:
    print("Error:", error)