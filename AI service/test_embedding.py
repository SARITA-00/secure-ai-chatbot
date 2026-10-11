import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=api_key)

text = """
NovaCart customers can return eligible products within 30 days
of receiving their order. Products must be unused and in their
original packaging.
"""

result = client.models.embed_content(
    model="gemini-embedding-2",
    contents=text,
    config=types.EmbedContentConfig(
        output_dimensionality=768
    )
)

embedding = result.embeddings[0].values

print("Embedding generated successfully!")
print("Dimensions:", len(embedding))
print("First 10 values:", embedding[:10])