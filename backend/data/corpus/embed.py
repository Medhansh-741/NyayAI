import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Force GEMINI_API_KEY explicitly
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def get_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text,
    )
    return result.embeddings[0].values

if __name__ == "__main__":
    test = get_embedding("This is a test legal section.")
    print(f"Embedding dimension: {len(test)}")
    print("Gemini embedding working!")