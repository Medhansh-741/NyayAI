"""
engine_groq.py — Primary strategy engine replaced for Groq Llama 3
Fully dynamic — grounded in actual sections from Agent 2.
No hardcoded forum maps. No hardcoded scripts.
"""

import os
import json
import time
import logging

from groq import Groq
from pydantic import ValidationError

from case_state import ActionPlan, CaseState

logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

ACTION_PLAN_SCHEMA = """{
  "immediate": [
    {
      "step": "short action title",
      "description": "specific what-to-do with section reference where applicable",
      "deadline": "specific deadline e.g. Within 48 hours / Today / Day 15 after notice",
      "priority": "high"
    }
  ],
  "medium_term": [
    {
      "step": "short action title",
      "description": "specific next phase action with reasoning",
      "deadline": "specific deadline",
      "priority": "medium"
    }
  ],
  "forum_selection": "exact forum name",
  "forum_selection_reason": "why this forum — cite jurisdiction rule and claim amount if relevant",
  "escalation_path": "Step 1 → Step 2 → Step 3 → Step 4",
  "timeline_estimate": "realistic estimate e.g. Lok Adalat: 1-2 months | Civil Court: 6-18 months",
  "cost_estimate": "₹X–₹Y with what it covers",
  "lawyer_recommended": false,
  "lawyer_recommended_reason": null,
  "evidence_checklist": ["specific document relevant to THIS case"],
  "avoid_list": ["specific action that would legally harm THIS case"],
  "mediation_recommended": false,
  "mediation_reason": null,
  "document_types_required": ["legal_notice"],
  "demand_amount": "₹X principal + interest/compensation if applicable",
  "relief_sought": "exactly what the complainant is asking for"
}"""

def _call_with_retry(prompt: str, max_attempts: int = 3) -> str:
    """Call Groq with exponential backoff. Returns parsed-valid JSON string."""
    last_error = None
    
    system_instruction = """You are a senior Indian litigation expert with 20+ years experience.
You specialize in citizen rights under BNS 2023, BNSS 2023, Consumer Protection Act 2019,
Industrial Disputes Act 1947, RTI Act 2005, Transfer of Property Act 1882, IT Act 2000,
Prevention of Corruption Act 1988, and all major Indian state laws.

Your job is to generate precise, actionable legal strategy grounded ONLY in the verified
law sections provided to you. Never invent section numbers. Never cite laws not in the input.
Always output valid JSON only. Never add explanation outside the JSON."""

    for attempt in range(1, max_attempts + 1):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ]
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            json.loads(raw)   # validate before returning
            return raw
        except Exception as e:
            last_error = e
            wait = 2 ** attempt
            logger.warning(f"[groq] attempt {attempt} failed: {e} — retrying in {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"Groq failed after {max_attempts} attempts: {last_error}")


def run_groq_engine(state: CaseState) -> ActionPlan:
    facts   = state.structured_facts
    mapping = state.legal_mapping

    # Build verified sections block — the legal grounding
    all_sections = []
    if mapping:
        all_sections += mapping.applicable_sections
        all_sections += mapping.bns_bnss_sections

    sections_block = "\n".join(
        f"  [{s.confidence.upper()}] {s.section_ref} — {s.act_name}"
        + (f": {s.description}" if s.description else "")
        for s in all_sections
    ) or "  (none provided — reason from dispute type and state only)"

    crossref_block = "\n".join(
        f"  {c.old_ref} ({c.act_old}) → NOW: {c.new_ref} ({c.act_new})"
        for c in (mapping.ipc_crpc_crossref if mapping else [])
    ) or "  None"

    variations_block = "\n".join(
        f"  - {v}" for v in (mapping.state_specific_variations if mapping else [])
    ) or "  None — apply central law"

    facts_block = "\n".join(
        f"  {i+1}. {f}" for i, f in enumerate(facts.key_facts if facts else [])
    ) or "  (no facts provided)"

    lang_instruction = {
        "hinglish": "Write all descriptions in natural Hinglish — mix Hindi and English. Example: 'Aapko ek formal notice bhejna chahiye within 48 hours, Maharashtra Rent Control Act ke under.'",
        "hindi":    "Sabhi descriptions aur steps pure, simple Hindi mein likhein.",
        "english":  "Write in clear plain English. Every citizen must understand without a law degree.",
    }.get(state.language_preference, "Write in plain English.")

    prompt = f"""Analyze this Indian legal dispute and generate a complete action strategy.

═══ CASE ═══
Dispute Type:   {facts.incident_type if facts else "unknown"}
State:          {state.state_jurisdiction or "not specified"}
Urgency:        {facts.urgency_level if facts else "standard"}
Legal Standing: {mapping.legal_standing_score if mapping else "moderate"} (assessed by Agent 2)

Key Facts:
{facts_block}

═══ VERIFIED LAW from Agent 2 — cite these exactly, do not invent sections ═══
Applicable Sections:
{sections_block}

BNS/BNSS Cross-references (old → current):
{crossref_block}

State-specific Variations:
{variations_block}

═══ LANGUAGE ═══
{lang_instruction}

═══ REASONING RULES ═══
1. Forum selection must be based on:
   - Dispute category (consumer/labour/criminal/civil/RTI/corruption)
   - Claim amount if determinable (Consumer: <₹50L=District, ₹50L-2Cr=State, >₹2Cr=NCDRC)
   - State jurisdiction (state law overrides central where applicable)
   - Which forum the verified sections above grant jurisdiction to

2. Immediate steps must:
   - Reference specific sections from the verified list above where applicable
   - Have realistic Indian deadlines based on actual limitation periods
   - Be ordered by legal urgency

3. Evidence checklist — only evidence that proves THIS specific dispute.

4. Avoid list — only actions that would legally harm THIS specific case.

5. lawyer_recommended = true if:
   - Criminal proceedings involved
   - Legal standing is weak
   - Multiple courts/forums needed simultaneously
   - Procedural complexity requires professional handling

6. mediation_recommended = true if Lok Adalat jurisdiction applies
   (civil/consumer/labour disputes where faster resolution benefits complainant)

7. Timeline must reflect actual Indian court/forum timelines — not optimistic.

8. Use BNS 2023 section numbers for ALL criminal matters after July 1 2024.
   Never cite IPC for post-July 2024 offences.

9. document_types_required — select ALL that apply:
   - "legal_notice"         always for any dispute with a monetary demand
   - "consumer_complaint"   consumer fraud / deficiency cases
   - "fir_draft"            cognizable criminal offences under BNS 2023
   - "rti_application"      RTI non-response cases
   - "affidavit"            when sworn statement needed
   - "corruption_complaint" CVC / Lokayukta complaints
   - "lawyer_brief"         always when lawyer_recommended = true

10. demand_amount — extract from facts if amount mentioned, add 18% interest if applicable.
    If no amount, write "As per actual loss and damages".

11. relief_sought — what the complainant specifically wants: refund / reinstatement /
    compensation / FIR registration etc. Must match the dispute type.

Return ONLY a JSON object matching this exact schema — no other text:
{ACTION_PLAN_SCHEMA}

Requirements:
- immediate: 2–4 steps
- medium_term: 2–3 steps
- evidence_checklist: 4–6 items
- avoid_list: 3–4 items
- escalation_path: minimum 3 steps"""

    raw = _call_with_retry(prompt)

    try:
        return ActionPlan(**json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as e:
        logger.error(f"[groq] ActionPlan validation failed: {e}\nRaw: {raw[:500]}")
        raise ValueError(f"Groq returned invalid ActionPlan: {e}")
