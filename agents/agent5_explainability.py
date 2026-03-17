"""
agent5_explainability.py — NyayAI Explainability Agent

Integration contract:
    Reads:       ALL CaseState fields (read-only — never modifies other agents' outputs)
    Writes:      reasoning_trace
    Appends to:  agent_trace, case_timeline
    Never touches: action_plan, generated_documents, legal_mapping, structured_facts
"""

import time
from datetime import datetime, timezone


def explainability_agent(case_state: dict, mode: str = "citizen") -> dict:

    start = time.time()

    facts = case_state.get("structured_facts", {})
    mapping = case_state.get("legal_mapping", {})
    plan = case_state.get("action_plan", {})
    docs = case_state.get("generated_documents")
    ev = case_state.get("evidence_inventory", [])
    all_traces = case_state.get("agent_trace", [])

    # ── Per-section confidence from Agent 2 ──────────────────────────────────

    all_sections = mapping.get("applicable_sections", []) + mapping.get("bns_bnss_sections", [])

    per_section_confidence = [
        {
            "section_ref": s.get("section_ref", "") if isinstance(s, dict) else str(s),
            "confidence": s.get("confidence", "medium") if isinstance(s, dict) else "medium",
            "reason": (s.get("description") if isinstance(s, dict) else str(s))
            or f"Retrieved by Agent 2 for {facts.get('incident_type','this dispute')}",
        }
        for s in all_sections
    ]

    # ── Citations ─────────────────────────────────────────────────────────────

    if mode == "lawyer":
        citations = [
            f"Case Law: {c.get('citation')} - {c.get('summary')}" if isinstance(c, dict) else str(c)
            for c in mapping.get("landmark_cases", [])
        ]
        
        for xref in mapping.get("ipc_crpc_crossref", []):
            if isinstance(xref, dict):
                citations.append(
                    f"Reference: {xref.get('old_ref')} ({xref.get('act_old')}) -> "
                    f"NOW ENFORCED AS {xref.get('new_ref')} ({xref.get('act_new')})"
                )
    else:
        citations = [
            f"{s.get('section_ref')} — {s.get('act_name')}" if isinstance(s, dict) else str(s)
            for s in all_sections
        ]
    
        for xref in mapping.get("ipc_crpc_crossref", []):
            if isinstance(xref, dict):
                citations.append(
                    f"{xref.get('old_ref')} ({xref.get('act_old')}) -> "
                    f"{xref.get('new_ref')} ({xref.get('act_new')})"
                )

    # ── Agent logs ───────────────────────────────────────────────────────────

    parties = facts.get("parties", [])

    complainant = next(
        (p.get("name") for p in parties if isinstance(p, dict) and p.get("role") == "complainant"),
        "Complainant"
    )

    agent_logs = [
        (
            f"[Agent 1 - Intake] Dispute: {facts.get('incident_type','unknown')}. "
            f"Complainant: {complainant}. "
            f"Urgency: {facts.get('urgency_level','standard')}. "
            f"Facts extracted: {len(facts.get('key_facts',[]))}. "
            f"Evidence items: {len(ev)}."
        ),
        (
            f"[Agent 2 - Research] Sections retrieved: {len(all_sections)}. "
            f"Legal standing: {mapping.get('legal_standing_score','moderate')}. "
            f"State: {case_state.get('state_jurisdiction','unknown')}."
        ),
    ]

    # ── Agent 3 reasoning ────────────────────────────────────────────────────

    strategy_trace = next(
        (e for e in all_traces if isinstance(e, dict) and e.get("agent") == "strategy"),
        {}
    )

    s_reasoning = strategy_trace.get("reasoning", {})

    agent_logs.append(
        f"[Agent 3 - Strategy] Forum: {plan.get('forum_selection','N/A')}. "
        f"Lawyer flag: {plan.get('lawyer_recommended',False)}. "
        f"Docs required: {plan.get('document_types_required',[])}."
    )

    # ── Agent 4 document inspection ──────────────────────────────────────────

    generated_keys = []

    if docs:
        itr = docs.model_fields.keys() if hasattr(docs, "model_fields") else docs.keys()
        for k in itr:
            v = getattr(docs, k) if hasattr(docs, "model_fields") else docs.get(k)
            if v is not None:
                generated_keys.append(k)

    drafting_trace = next(
        (e for e in all_traces if isinstance(e, dict) and e.get("agent") == "drafting"),
        {}
    )

    fallback_count = 0

    if docs:
        for k in generated_keys:
            doc_obj = getattr(docs, k) if hasattr(docs, "model_fields") else docs.get(k)
            if doc_obj:
                agent_logs.append(f"Document Generated: {k}")

    agent_logs.append(
        f"[Agent 4 - Drafting] Documents generated: {generated_keys}. "
        f"Fallbacks used: {fallback_count}. "
        f"Duration: {drafting_trace.get('duration_ms','N/A')}ms."
    )

    # ── Overall confidence ───────────────────────────────────────────────────

    conf_scores = [s.get("confidence","medium") if isinstance(s, dict) else "medium" for s in all_sections]
    standing = mapping.get("legal_standing_score","moderate")

    if all(c == "high" for c in conf_scores) and standing == "strong":
        overall = "high"
    elif any(c == "low" for c in conf_scores) or standing == "weak":
        overall = "low"
    else:
        overall = "medium"

    # ── Legal standing breakdown ─────────────────────────────────────────────

    parts = []

    if standing:
        parts.append(f"Legal standing: {standing.upper()} (assessed by Agent 2)")

    forum_basis = s_reasoning.get("forum_selection_basis") or plan.get("forum_selection_reason")

    if forum_basis:
        parts.append(f"Forum rationale: {forum_basis}")

    if plan.get("lawyer_recommended") and plan.get("lawyer_recommended_reason"):
        parts.append(f"Lawyer recommended: {plan.get('lawyer_recommended_reason')}")

    if plan.get("mediation_recommended") and plan.get("mediation_reason"):
        parts.append(f"Mediation: {plan.get('mediation_reason')}")

    legal_standing_breakdown = " | ".join(parts) or "See action plan for reasoning."

    # ── Write reasoning_trace ────────────────────────────────────────────────

    case_state["reasoning_trace"] = {
        "per_section_confidence": per_section_confidence,
        "agent_logs": agent_logs,
        "citations": citations,
        "overall_confidence": overall,
        "legal_standing_breakdown": legal_standing_breakdown,
    }

    # ── Logging ──────────────────────────────────────────────────────────────

    duration_ms = int((time.time() - start) * 1000)

    now = datetime.now(timezone.utc).isoformat()

    case_state.setdefault("agent_trace", []).append({
        "agent": "explainability",
        "timestamp": now,
        "action": "generated_reasoning_trace",
        "duration_ms": duration_ms
    })

    case_state.setdefault("case_timeline", []).append({
        "event": "Explainability agent completed",
        "timestamp": now,
        "actor": "agent"
    })

    return case_state