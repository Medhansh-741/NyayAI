from config import QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME, EMBEDDING_MODEL
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import os

COLLECTION = "nyay_ai_laws"

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

model = SentenceTransformer(EMBEDDING_MODEL)


def search_law(query, limit=5):

    vector = model.encode(query).tolist()

    results = client.query_points(
        collection_name=COLLECTION,
        query=vector,
        limit=limit
    ).points

    matches = []

    for r in results:
        matches.append({
            "act": r.payload["act"],
            "section": r.payload["section"],
            "text": r.payload["text"],
            "score": r.score
        })

    return matches