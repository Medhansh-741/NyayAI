from __future__ import annotations

import io
import json
import logging
import os
import re
import tempfile
import time
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from groq import Groq
from sarvamai import SarvamAI

from case_state import CaseState, EvidenceItem, Party, StructuredFacts

logger = logging.getLogger(__name__)


GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 2048
MAX_FOLLOWUP_TOKENS = 200


INTAKE_SYSTEM_PROMPT = """You are the Intake Agent for Nyay AI, a legal assistance platform for Indian citizens.

Your job is to analyse a citizen's raw narrative and extract a precise, structured incident report.

IMPORTANT RULES:
1. Return ONLY valid JSON — no preamble, no markdown fences, no explanation.
2. Detect the user's language (hindi / english / hinglish) from the narrative.
3. Detect the Indian state/jurisdiction from location clues in the narrative.
4. Be conservative — only assert facts clearly present in the narrative.
5. List missing information a lawyer would normally need.

Classify incident_type as exactly one of:
consumer | tenant | labour | criminal | cyber | property | family | rti | corruption

Classify urgency_level as exactly one of:
immediate | standard | low

Return the exact JSON structure matching this schema:
{
  "language_preference": "string (hindi/english/hinglish)",
  "state_jurisdiction": "string (e.g. Delhi, Maharashtra) or null",
  "structured_facts": {
    "incident_type": "string",
    "incident_summary": "string",
    "incident_date": "string or null",
    "parties": [
      {
        "role": "string",
        "name": "string or null",
        "contact": "string or null",
        "description": "string or null"
      }
    ],
    "timeline": ["string"],
    "urgency_level": "string",
    "monetary_value_inr": "number or null",
    "key_facts": ["string"],
    "missing_information": ["string"],
    "dispute_context": "string or null"
  },
  "evidence_inventory": [
    {
      "evidence_type": "string",
      "date_of_evidence": "string or null",
      "relevance_score": "number (0.0 to 1.0)",
      "description": "string",
      "tags": ["string"]
    }
  ]
}
"""


FOLLOWUP_SYSTEM_PROMPT = """You convert missing legal-intake details into natural follow-up questions.

Rules:
Return ONLY a JSON array of strings.
Ask at most 3 concise questions.
"""


# ─────────────────────────────────────────────
# Language mapping
# ─────────────────────────────────────────────

def _detect_language_code(language_preference: str) -> str:

    mapping = {
        "hindi": "hi-IN",
        "hinglish": "hi-IN",
        "english": "en-IN",
    }

    return mapping.get(language_preference, "en-IN")


# ─────────────────────────────────────────────
# OCR
# ─────────────────────────────────────────────

def _ocr_file(filename: str, sarvam_client: SarvamAI, language_code: str):

    logger.info(f"[Akshar] OCR start: {filename}")

    job = sarvam_client.document_intelligence.create_job(
        language=language_code,
        output_format="md",
    )

    job.upload_file(filename)
    job.start()

    status = job.wait_until_complete()

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_zip:
        zip_path = tmp_zip.name

    try:

        job.download_output(output_path=zip_path)

        with zipfile.ZipFile(zip_path) as zf:

            md_files = sorted([n for n in zf.namelist() if n.endswith(".md")])

            pages = [
                zf.read(name).decode("utf-8", errors="replace")
                for name in md_files
            ]

            text = "\n\n".join(pages)

            text = re.sub(
                r'!\[.*?\]\(data:image/[^;]+;base64,[^)]+\)',
                "[Embedded Image]",
                text,
            )

    finally:

        os.remove(zip_path)

    return {
        "filename": filename,
        "extracted_text": text,
        "ocr_engine": "sarvam-akshar",
        "language_code": language_code,
        "job_state": status.job_state,
        "processed_at": datetime.utcnow().isoformat(),
    }


# ─────────────────────────────────────────────
# LLM extraction
# ─────────────────────────────────────────────

def _call_groq(narrative: str, ocr_context: str, client: Groq):

    content = narrative

    if ocr_context:
        content += f"\n\n--- Attached document text ---\n{ocr_context}"

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[
            {"role": "system", "content": INTAKE_SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
    )

    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    print(raw)
    try:
        return json.loads(raw)

    except json.JSONDecodeError as exc:

        logger.error("JSON parse failed")

        raise ValueError(f"{GROQ_MODEL} returned non-JSON output") from exc


# ─────────────────────────────────────────────
# Builders
# ─────────────────────────────────────────────

def _build_structured_facts(data: dict):

    sf = data.get("structured_facts", {})

    parties = []
    for p in sf.get("parties", []):
        p["role"] = p.get("role") or "unknown"
        parties.append(Party(**p))

    return StructuredFacts(
        incident_type=sf.get("incident_type") or "consumer",
        incident_summary=sf.get("incident_summary") or "No summary provided.",
        incident_date=sf.get("incident_date"),
        parties=parties,
        timeline=sf.get("timeline", []),
        urgency_level=sf.get("urgency_level") or "medium",
        monetary_value_inr=sf.get("monetary_value_inr"),
        key_facts=sf.get("key_facts", []),
        missing_information=sf.get("missing_information", []),
        dispute_context=sf.get("dispute_context"),
    )


def _build_evidence_inventory(data: dict, ocr_docs):

    items = []

    for ev in data.get("evidence_inventory", []):

        items.append(EvidenceItem(
            file_reference=ev.get("file_reference"),
            evidence_type=ev.get("evidence_type") or "other",
            date_of_evidence=ev.get("date_of_evidence"),
            relevance_score=float(ev.get("relevance_score") or 0.5),
            description=ev.get("description") or "Document attachment",
            tags=ev.get("tags", []),
        ))

    for doc in ocr_docs:

        items.append(EvidenceItem(
            file_reference=doc["filename"],
            evidence_type="other",
            relevance_score=0.5,
            description=f"Uploaded file: {doc['filename']}",
            ocr_text=doc.get("extracted_text"),
            tags=["uploaded"],
        ))

    return items


# ─────────────────────────────────────────────
# Follow-up generation
# ─────────────────────────────────────────────

def _generate_followup_questions(narrative, missing_information, groq_client):

    if not missing_information:
        return []

    prompt = f"""
Citizen narrative:
{narrative}

Missing information:
{missing_information}

Convert to natural questions.
Return JSON list only.
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=MAX_FOLLOWUP_TOKENS,
        messages=[
            {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        return json.loads(raw)[:3]

    except Exception:

        questions = []

        for item in missing_information[:3]:

            questions.append(f"Could you provide {item.lower()}?")

        return questions


# ─────────────────────────────────────────────
# Main entry
# ─────────────────────────────────────────────

def run(state: CaseState, groq_client: Optional[Groq] = None, sarvam_client: Optional[SarvamAI] = None):

    t0 = time.time()

    groq = groq_client or Groq(api_key=os.environ.get("GROQ_API_KEY"))

    sarvam_key = os.environ.get("SARVAM_API_KEY")

    if sarvam_client:
        sarvam = sarvam_client
    elif sarvam_key:
        sarvam = SarvamAI(api_subscription_key=sarvam_key)
    else:
        raise RuntimeError("SARVAM_API_KEY not set")

    lang_code = _detect_language_code(state.language_preference)

    ocr_docs = []

    for filename in state.uploaded_files:

        try:

            ocr_docs.append(_ocr_file(filename, sarvam, lang_code))

        except Exception as exc:

            logger.warning(f"OCR failed for {filename}: {exc}")

            state.human_review_flags.append(f"OCR failed for file: {filename}")

    ocr_context = "\n\n".join(
        f"[{d['filename']}]\n{d['extracted_text']}" for d in ocr_docs
    )

    try:

        extracted = _call_groq(state.raw_narrative, ocr_context, groq)

    except ValueError as exc:

        state.human_review_flags.append(f"Intake extraction failed: {exc}")

        return state

    state.language_preference = extracted.get("language_preference", "english")

    state.state_jurisdiction = extracted.get("state_jurisdiction")

    state.ocr_documents = ocr_docs

    state.structured_facts = _build_structured_facts(extracted)

    state.evidence_inventory = _build_evidence_inventory(extracted, ocr_docs)

    missing = state.structured_facts.missing_information

    if missing:

        state.follow_up_questions = _generate_followup_questions(
            narrative=state.raw_narrative,
            missing_information=missing,
            groq_client=groq,
        )

        state.intake_status = "awaiting_user_response"

        return state

    state.intake_status = "complete"

    elapsed = round(time.time() - t0, 2)

    state.agent_trace.append(
        f"[Agent1] Completed {datetime.utcnow().isoformat()} ({elapsed}s)"
    )

    state.case_timeline.append(
        f"{datetime.utcnow().isoformat()} — Intake completed"
    )

    return state