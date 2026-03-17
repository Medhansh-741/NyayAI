import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Load .env from root
# Path: backend/scripts/ingestion/reset_qdrant.py -> root/.env (level 4)
root_path = Path(__file__).parent.parent.parent.parent
load_dotenv(root_path / ".env")

client = QdrantClient(
    url=os.environ.get("QDRANT_URL"),
    api_key=os.environ.get("QDRANT_API_KEY"),
)

collection = "nyay_ai_laws"

try:
    client.delete_collection(collection)
    print("Old collection deleted")
except:
    print("Collection did not exist")

client.create_collection(
    collection_name=collection,
    vectors_config={
        "size": 384,
        "distance": "Cosine"
    }
)

print("Fresh collection created")