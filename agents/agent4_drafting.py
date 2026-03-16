"""
agent4_drafting.py — NyayAI Drafting Agent (Groq version)

Integration contract:
    Reads:       structured_facts, legal_mapping, action_plan, evidence_inventory,
                 state_jurisdiction, language_preference
    Writes:      generated_documents (includes Word + PDF export)
    Appends to:  agent_trace, case_timeline
    Never touches: reasoning_trace, or any other agent's output fields
"""

import os
import time
import json
import logging
from datetime import datetime, timezone

from groq import Groq
from dotenv import load_dotenv

import docx
from markdown_pdf import MarkdownPdf, Section

from case_state import GeneratedDocuments, GeneratedDoc

load_dotenv()
logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

# Ensure output directory exists for exported files
OUTPUT_DIR = os.path.join(os.getcwd(), "output_docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Context builder ───────────────────────────────────────────────────────────

def _build_context(case_state: dict) -> dict:
    facts = case_state.get("structured_facts", {})
    mapping = case_state.get("legal_mapping", {})
    plan = case_state.get("action_plan", {})
    ev = case_state.get("evidence_inventory", [])

    parties = facts.get("parties", [])
    complainant = next((p.get("name", "Complainant") for p in parties if p.get("role") == "complainant"), "Complainant")
    respondent = next((p.get("name", "Respondent") for p in parties if p.get("role") == "respondent"), "Respondent")

    all_sections = mapping.get("applicable_sections", []) + mapping.get("bns_bnss_sections", [])

    sections_block = "\n".join(
        f"[{s.get('confidence','medium').upper()}] {s['section_ref']} — {s['act_name']}"
        for s in all_sections
    )

    facts_block = "\n".join(
        f"{i+1}. {f}" for i, f in enumerate(facts.get("key_facts", []))
    )

    evidence_block = "\n".join(
        f"- {e.get('type','Document')} ({e.get('file_reference','file')})"
        for e in ev
    )

    return {
        "complainant": complainant,
        "respondent": respondent,
        "dispute_type": facts.get("incident_type", "legal dispute"),
        "state": case_state.get("state_jurisdiction", "India"),
        "date": datetime.now().strftime("%B %d, %Y"),
        "facts_block": facts_block,
        "sections_block": sections_block,
        "forum": plan.get("forum_selection", "appropriate forum"),
        "demand_amount": plan.get("demand_amount", ""),
        "relief_sought": plan.get("relief_sought", ""),
        "escalation_path": plan.get("escalation_path", ""),
        "evidence_block": evidence_block,
        "language": case_state.get("language_preference", "english"),
    }


# ── LLM call ──────────────────────────────────────────────────────────────────

def _call_groq(prompt: str) -> dict:
    
    system_prompt = """You are an expert Indian Legal Assistant. Your job is to draft formal legal documents.
You must output ONLY valid JSON.
{
  "content_md": "The drafted document in markdown format",
  "document_title": "The formal title of the document"
}"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    )
    
    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()

    return json.loads(raw)


# ── File Exporters ────────────────────────────────────────────────────────────

def _export_to_docx(content_md: str, filepath: str):
    doc = docx.Document()
    for line in content_md.split("\n"):
        doc.add_paragraph(line)
    doc.save(filepath)

def _export_to_pdf(content_md: str, filepath: str):
    pdf = MarkdownPdf()
    pdf.add_section(Section(content_md, toc=False))
    pdf.save(filepath)


# ── Main Agent ────────────────────────────────────────────────────────────────

def drafting_agent(case_state: dict) -> dict:

    start = time.time()

    plan = case_state.get("action_plan", {})
    doc_types = plan.get("document_types_required") or ["legal_notice"]
    
    # Requirement: PRD v4.0 explicitly requires 'lawyer_brief' if 'lawyer_recommended' is true
    if plan.get("lawyer_recommended") and "lawyer_brief" not in doc_types:
        doc_types.append("lawyer_brief")

    context = _build_context(case_state)

    generated = {}

    for doc_type in doc_types:

        prompt = f"""
Generate a professional {doc_type} for this case.

Case Details:
Dispute Type: {context['dispute_type']}
Complainant: {context['complainant']}
Respondent: {context['respondent']}

Facts:
{context['facts_block']}

Law Sections:
{context['sections_block']}

Relief:
{context['relief_sought']}
Return ONLY the requested JSON schema.
"""

        try:
            result = _call_groq(prompt)

            content = result.get("content_md", "")

            if "DISCLAIMER" not in content.upper():
                content += (
                    "\n\n---\nDISCLAIMER: This document is AI-generated and does not "
                    "constitute legal advice."
                )

            # File generation (Word + PDF)
            safe_title = f"{case_state.get('case_id', 'case')}_{doc_type}"
            docx_path = os.path.join(OUTPUT_DIR, f"{safe_title}.docx")
            pdf_path = os.path.join(OUTPUT_DIR, f"{safe_title}.pdf")
            
            _export_to_docx(content, docx_path)
            _export_to_pdf(content, pdf_path)

            generated[doc_type] = {
                "content_md": content,
                "document_title": result.get("document_title", doc_type),
                "docx_url": docx_path,
                "pdf_url": pdf_path,
                "disclaimer_included": True,
            }

        except Exception as e:

            logger.error(f"[agent4] generation failed: {e}")

            generated[doc_type] = {
                "content_md": f"Document generation failed. Error: {e}",
                "document_title": doc_type,
                "docx_url": None,
                "pdf_url": None,
                "disclaimer_included": True,
            }

    # ── Correct CaseState compliant write ─────────────────────────────────────

    existing_docs = case_state.get("generated_documents")

    if existing_docs is None:
        existing_docs = GeneratedDocuments()
    elif isinstance(existing_docs, dict):
        existing_docs = GeneratedDocuments(**existing_docs)

    for doc_type, doc_data in generated.items():
        if hasattr(existing_docs, doc_type):
            setattr(
                existing_docs,
                doc_type,
                GeneratedDoc(
                    content_md=doc_data["content_md"],
                    docx_url=doc_data["docx_url"],
                    pdf_url=doc_data["pdf_url"],
                    disclaimer_included=doc_data["disclaimer_included"],
                ),
            )

    # Use dict dump to retain pipeline data contract if standard dict expected
    case_state["generated_documents"] = existing_docs.model_dump()

    # ── tracing ───────────────────────────────────────────────────────────────

    duration_ms = int((time.time() - start) * 1000)
    now = datetime.now(timezone.utc).isoformat()

    case_state.setdefault("agent_trace", []).append({
        "agent": "drafting",
        "timestamp": now,
        "duration_ms": duration_ms,
        "docs_generated": list(generated.keys())
    })

    case_state.setdefault("case_timeline", []).append({
        "event": "Drafting agent completed",
        "timestamp": now
    })

    return case_state