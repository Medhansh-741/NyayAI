from qdrant_client import QdrantClient

qdrant = QdrantClient(
    url="https://b169536c-74b6-4efc-bbc8-fc0277e852a1.eu-central-1-0.aws.cloud.qdrant.io",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.m1otz3wszfG7iiO1SWH9zVhygX5fvsEvnkGPf9icKJs"
)

print(qdrant.get_collections())