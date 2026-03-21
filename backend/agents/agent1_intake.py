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


def _call_with_retry(prompt: str, system_prompt: str, client: Groq, max_attempts: int = 3, json_mode: bool = True) -> dict:
    """Call Groq with exponential backoff and JSON validation."""
    last_error = None
    
    for attempt in range(1, max_attempts + 1):
        try:
            extra_args = {"response_format": {"type": "json_object"}} if json_mode else {}
            
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                **extra_args
            )
            raw = response.choices[0].message.content.strip()
            
            # Robust JSON extraction
            start_idx = raw.find('{')
            end_idx = raw.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                raw_json = raw[start_idx:end_idx]
                return json.loads(raw_json)
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            last_error = e
            wait = 2 ** attempt
            logger.warning(f"[groq] attempt {attempt} failed: {e} — retrying in {wait}s")
            time.sleep(wait)
            
    raise RuntimeError(f"Groq failed after {max_attempts} attempts: {last_error}")


INTAKE_SYSTEM_PROMPT = """You are a Professional Legal Intake Officer at a high-end Indian law firm.

Your job is to analyse a citizen's raw narrative and extract a precise, structured incident report. 

TONE & BEHAVIOR:
1. PERSONA: Professional Legal Intake Clerk. Direct and efficient.
2. DELTA-ONLY: The `new_facts` array MUST strictly contain only information provided in the VERY LAST user message.
3. ABSOLUTELY NO RECAP: Do NOT include facts in `new_facts` that were already mentioned in the prior chat history. If the user repeats themselves, `new_facts` should be empty.
4. POINTED QUESTIONS: Focus `follow_up_query` on the highest priority missing data.
5. NO FLUFF: No "I have noted that" or "Acknowledging your facts" phrases.

Return ONLY valid JSON.

If the user is just saying hello, return "GREETING" in intent. If the input is nonsensical/gibberish, return "ABSURD" in intent. Otherwise return "LEGAL".

7. ALLOWED CATEGORIES: You MUST categorize the legal issue into one of these strict keys for the `incident_type` field:
   - `consumer` (Consumer disputes, product defects, services)
   - `tenant` (Rent, eviction, landlord issues)
   - `labour` (Employment, salary, harassment at work)
   - `criminal` (Theft, assault, FIRs, bail)
   - `cyber` (Online fraud, hacking, harassment)
   - `property` (Land disputes, inheritance, registration)
   - `family` (Marriage, custody, inheritance)
   - `divorce` (Separation, alimony)
   - `debt_recovery` (Loans, recovery, cheque bounce)
   - `civil` (General contracts, damages, non-categorized civil)
   - `other` (Use ONLY if none of the above apply)

Return ONLY valid JSON.
{
  "intent": "string (GREETING/ABSURD/LEGAL)",
  "new_facts": ["string (Only NEWly discovered facts from the current turn)"],
  "follow_up_query": "string (A professional direct question for missing information)",
  "conversational_response": "string (OPTIONAL: Only used for GREETING or ABSURD intents. For LEGAL, leave null as it will be constructed from new_facts and follow_up_query.)",
  "language_preference": "string (hindi/english/hinglish)",
  "state_jurisdiction": "string (e.g. Delhi, Maharashtra) or null",
  "structured_facts": {
    "incident_type": "string (Must be one of the ALLOWED CATEGORIES keys)",
        "case_title": "string (short case title in plain language, max 90 chars) or null",
    "incident_summary": "string or null",
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
      "file_reference": "string (e.g. invoice, medical report)",
      "evidence_type": "string (receipt/agreement/photo/other)",
      "description": "string (concise description)"
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

    return _call_with_retry(content, INTAKE_SYSTEM_PROMPT, client)


# ─────────────────────────────────────────────
# Builders
# ─────────────────────────────────────────────

def _build_structured_facts(data: dict):

    sf = data.get("structured_facts", {})

    parties = []
    for p in sf.get("parties", []):
        p["role"] = p.get("role") or "unknown"
        parties.append(Party(**p))

    VALID_URGENCY = {"immediate", "standard", "low"}
    raw_urgency = sf.get("urgency_level") or "standard"
    urgency = raw_urgency if raw_urgency in VALID_URGENCY else "standard"

    return StructuredFacts(
        incident_type=sf.get("incident_type"),
        case_title=sf.get("case_title"),
        incident_summary=sf.get("incident_summary"),
        incident_date=sf.get("incident_date"),
        parties=parties,
        timeline=sf.get("timeline", []),
        urgency_level=urgency,
        monetary_value_inr=sf.get("monetary_value_inr"),
        key_facts=sf.get("key_facts", []),
        missing_information=sf.get("missing_information", []),
        dispute_context=sf.get("dispute_context"),
    )


def _build_evidence_inventory(data: dict, ocr_docs):

    items = []

    for ev in data.get("evidence_inventory", []):
        # Type guard: LLM might return a string instead of an object
        if isinstance(ev, str):
            items.append(EvidenceItem(
                file_reference=ev,
                evidence_type="other",
                description=f"User mentioned having: {ev}",
                relevance_score=0.7
            ))
            continue

        items.append(EvidenceItem(
            file_reference=ev.get("file_reference") or "unknown_doc",
            evidence_type=ev.get("evidence_type") or "other",
            date_of_evidence=ev.get("date_of_evidence"),
            relevance_score=float(ev.get("relevance_score") or 0.6),
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
# Completeness scoring
# ─────────────────────────────────────────────

def _compute_completeness_score(state: CaseState) -> int:
    """Count how many of the 5 critical intake fields are filled."""
    score = 0
    sf = state.structured_facts
    if sf.incident_type:
        score += 1
    if sf.incident_summary:
        score += 1
    if sf.parties and len(sf.parties) >= 1:
        score += 1
    if sf.key_facts and len(sf.key_facts) >= 1:
        score += 1
    if state.state_jurisdiction:
        score += 1
    return score


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
        
        intent = extracted.get("intent", "LEGAL")
        state.conversational_response = extracted.get("conversational_response")
        
        # If intent is LEGAL, we construct the response from points
        if intent == "LEGAL":
            new_facts = extracted.get("new_facts", [])
            query = extracted.get("follow_up_query", "")
            
            # Filter out empty or recap-style facts
            clean_facts = [f for f in new_facts if f and len(f) > 3]
            
            if clean_facts:
                fact_list = "\n".join([f"• {f}" for f in clean_facts])
                state.conversational_response = f"{fact_list}\n\n{query}"
            else:
                state.conversational_response = query

        # Fallback Generator
        if not state.conversational_response:
            if intent == "GREETING":
                state.conversational_response = "Greetings. I am your Legal Intake Assistant. Please provide the details of the incident you wish to report."
            elif intent == "ABSURD":
                state.conversational_response = "I am unable to process your last input. To assist you, I require a description of a legal incident, such as a consumer dispute or property matter. Please provide specific details."
            else:
                missing = extracted.get("structured_facts", {}).get("missing_information", [])
                if missing:
                    state.conversational_response = f"I have recorded the initial facts. To proceed, I specifically require details regarding: {', '.join(missing[:2])}."
                else:
                    state.conversational_response = "The necessary facts have been gathered. I am proceeding with the legal analysis."

    except ValueError as exc:

        state.human_review_flags.append(f"Intake extraction failed: {exc}")

        return state

    state.language_preference = extracted.get("language_preference", "english")

    state.state_jurisdiction = extracted.get("state_jurisdiction")

    state.ocr_documents = ocr_docs

    state.structured_facts = _build_structured_facts(extracted)

    # Ensure facts are null for non-legal intents to prevent early pipeline trigger
    if intent in ["GREETING", "ABSURD"]:
        state.structured_facts.incident_type = None
        state.structured_facts.incident_summary = None

    state.evidence_inventory = _build_evidence_inventory(extracted, ocr_docs)

    missing = state.structured_facts.missing_information

    # IMPORTANT: If it's a greeting or absurd, we NEVER mark it as complete.
    if intent in ["GREETING", "ABSURD"]:
        state.intake_status = "awaiting_user_response"
        # Ensure there's at least one question to keep the bot conversational
        if not state.follow_up_questions:
            state.follow_up_questions = ["Could you please describe your legal situation?"]
        return state

    # ── Completeness threshold: skip follow-ups if query is detailed enough ──
    completeness = _compute_completeness_score(state)
    logger.info(f"[Agent1] Completeness score: {completeness}/5 | Missing: {missing}")

    if completeness >= 4:
        # Query is detailed enough — proceed directly to full analysis
        logger.info(f"[Agent1] Score >= 4, skipping follow-ups → marking complete")
        state.intake_status = "complete"
    elif missing:
        # Ask AT MOST 1 question, no extra Groq call
        top_missing = missing[0]
        state.follow_up_questions = [f"Could you provide {top_missing.lower()}?"]
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