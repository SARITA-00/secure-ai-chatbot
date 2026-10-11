from app.rag.database import get_connection

try:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    tables = cursor.fetchall()

    print("\nTables in the database:")
    
    if tables:
        for table in tables:
            print("-", table[0])
    else:
        print("No tables found.")

    cursor.close()
    connection.close()

except Exception as error:
    print("Error:", error)