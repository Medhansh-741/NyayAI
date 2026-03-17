import os
import time
import uuid
from config import QDRANT_URL, QDRANT_API_KEY
from ingestion.config import COLLECTION_NAME, VECTOR_SIZE
from ingest import load_all_pdfs
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from pypdf import PdfReader
from pathlib import Path
from sentence_transformers import SentenceTransformer

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
model = SentenceTransformer('all-MiniLM-L6-v2')

COLLECTION_NAME = "nyay_ai_laws"
VECTOR_SIZE = 384

def get_embedding(text):
    return model.encode(text).tolist()

def create_collection():
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION_NAME not in existing:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"Collection '{COLLECTION_NAME}' created.")
    else:
        print(f"Collection '{COLLECTION_NAME}' already exists, deleting and recreating...")
        qdrant.delete_collection(COLLECTION_NAME)
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )

def upload_all():
    create_collection()

    records = load_all_pdfs()

    print(f"\nUploading {len(records)} chunks...")

    points = []

    for i, record in enumerate(records):

        embedding = get_embedding(record["text"])

        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "act": record["act"],
                "section": record["section"],
                "text": record["text"],
                "source": record["source"]
            }
        ))

        if len(points) >= 50:
            qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
            points = []
            time.sleep(0.2)

    if points:
        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)

    print("\n✅ All laws uploaded to Qdrant!")

if __name__ == "__main__":
    upload_all()