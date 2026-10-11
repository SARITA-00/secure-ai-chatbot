from app.rag.database import get_connection

try:
    connection = get_connection()
    print("Database connection successful!")
    connection.close()

except Exception as error:
    print("Database connection failed.")
    print("Error:", error)