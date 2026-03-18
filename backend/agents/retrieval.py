from config import QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME, EMBEDDING_MODEL
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from typing import Any

COLLECTION = "nyay_ai_laws"

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

model = SentenceTransformer(EMBEDDING_MODEL)

TOPIC_ORDER = [
    "Most Used Section",
    "Primary Offence/Core Law Section",
    "Punishment/Liability Section",
    "Attempt/Abetment/Secondary Liability Section",
    "Procedure Related Section",
    "Special Case/Exception Section",
    "Recent Amendment/Updated Provision",
    "Related Supporting Section",
]

TOPIC_HINTS = {
    "Most Used Section": "most used legal section key provision",
    "Primary Offence/Core Law Section": "primary offence core law section",
    "Punishment/Liability Section": "punishment penalty liability section",
    "Attempt/Abetment/Secondary Liability Section": "attempt abetment secondary liability section",
    "Procedure Related Section": "procedure investigation trial complaint filing section",
    "Special Case/Exception Section": "exception proviso special case section",
    "Recent Amendment/Updated Provision": "recent amendment updated provision latest changes",
    "Related Supporting Section": "related supporting supplementary section",
}

DOMAIN_ALIASES = {
    "civil procedure": "civil law",
    "cyber law": "cyber",
    "data privacy": "privacy",
    "pil": "public interest litigation",
    "rti": "right to information",
}


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


def _normalize_domain(domain: str) -> str:
    normalized = (domain or "").strip().lower()
    return DOMAIN_ALIASES.get(normalized, normalized)


def _one_line_explanation(text: str, max_chars: int = 170) -> str:
    clean = " ".join((text or "").split())
    if not clean:
        return "No explanation available for this provision."

    for sep in [". ", "; ", ": "]:
        if sep in clean:
            clean = clean.split(sep)[0].strip()
            break

    if len(clean) > max_chars:
        clean = clean[: max_chars - 3].rstrip() + "..."
    return clean


def get_domain_topic_sections(domain: str, per_topic_limit: int = 5) -> list[dict[str, Any]]:
    domain_query = _normalize_domain(domain)
    used_sections: set[tuple[str, str]] = set()
    topic_items: list[dict[str, Any]] = []

    for topic in TOPIC_ORDER:
        hint = TOPIC_HINTS[topic]
        scoped_query = f"{domain_query} law in India {hint}"
        candidates = search_law(scoped_query, limit=per_topic_limit)

        selected = None
        for item in candidates:
            key = (str(item.get("act", "")), str(item.get("section", "")))
            if key not in used_sections:
                selected = item
                used_sections.add(key)
                break

        is_fallback = False
        if selected is None:
            fallback_candidates = search_law(f"{domain_query} legal section India", limit=per_topic_limit)
            for item in fallback_candidates:
                key = (str(item.get("act", "")), str(item.get("section", "")))
                if key not in used_sections:
                    selected = item
                    used_sections.add(key)
                    is_fallback = True
                    break

        if selected is None:
            topic_items.append(
                {
                    "title": topic,
                    "explanation": "No directly relevant section found in current corpus for this domain.",
                    "source_section": "Not available",
                    "score": None,
                    "is_fallback": True,
                }
            )
            continue

        act = str(selected.get("act", "Unknown Act"))
        section = str(selected.get("section", "N/A"))
        topic_items.append(
            {
                "title": topic,
                "explanation": _one_line_explanation(str(selected.get("text", ""))),
                "source_section": f"{act} - Section {section}",
                "score": float(selected.get("score", 0.0)),
                "is_fallback": is_fallback,
            }
        )

    return topic_items