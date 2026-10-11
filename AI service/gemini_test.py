import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=10000)
)

print("Sending request...")

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents="Say hello in one sentence."
)

print("Response received:")
print(response.text)