"""
agent.py — Agent 3 orchestrator
Primary: Groq (dynamic, grounded in Agent 2 sections)
Fallback: Rules engine (deterministic, offline)
"""

import os
import time
import logging
from datetime import datetime, timezone

from dotenv import load_dotenv
from case_state import CaseState

load_dotenv(override=False)

ENGINE = os.getenv("STRATEGY_ENGINE", "groq")
logger = logging.getLogger(__name__)


def run_strategy_agent(state: CaseState) -> CaseState:
    start       = time.time()
    engine_used = ENGINE

    # ── Primary engine ────────────────────────────────────────────────────────
    try:
        if ENGINE == "groq":
            from engine_groq import run_groq_engine
            plan = run_groq_engine(state)
        elif ENGINE == "gemini":
            from engine_gemini import run_gemini_engine
            plan = run_gemini_engine(state)
        else:
            from engine_rules import run_rules_engine
            plan = run_rules_engine(state)

    except Exception as e:
        # ── Fallback ──────────────────────────────────────────────────────────
        logger.warning(f"[agent3] '{ENGINE}' failed: {e} — falling back to rules engine")
        from engine_rules import run_rules_engine
        plan        = run_rules_engine(state)
        engine_used = "rules_fallback"

    duration_ms = int((time.time() - start) * 1000)
    now         = datetime.now(timezone.utc).isoformat()

    # ── Write action_plan ─────────────────────────────────────────────────────
    state.action_plan = plan

    # ── Append to agent_trace — never overwrite ───────────────────────────────
    sections_used = []
    if state.legal_mapping:
        sections_used = [s.section_ref for s in state.legal_mapping.applicable_sections]
        sections_used += [s.section_ref for s in state.legal_mapping.bns_bnss_sections]

    state.agent_trace.append({
        "agent":          "strategy",
        "timestamp":      now,
        "action":         "generated_action_plan",
        "input_summary": (
            f"dispute={state.structured_facts.incident_type if state.structured_facts else 'unknown'}, "
            f"standing={state.legal_mapping.legal_standing_score if state.legal_mapping else 'unknown'}, "
            f"sections_count={len(sections_used)}"
        ),
        "output_summary": (
            f"forum={plan.forum_selection}, "
            f"lawyer_recommended={plan.lawyer_recommended}, "
            f"docs_required={plan.document_types_required}, "
            f"immediate_steps={len(plan.immediate)}, "
            f"engine={engine_used}"
        ),
        "duration_ms": duration_ms,
        # Agent 5 reads this block for reasoning_trace
        "reasoning": {
            "forum_selection_basis": plan.forum_selection_reason,
            "lawyer_recommended_basis": plan.lawyer_recommended_reason,
            "legal_standing_input":  state.legal_mapping.legal_standing_score if state.legal_mapping else None,
            "sections_used":         sections_used,
            "engine_used":           engine_used,
            "document_types":        plan.document_types_required,
            "demand_amount":         plan.demand_amount,
            "relief_sought":         plan.relief_sought,
        }
    })

    # ── Append to case_timeline ───────────────────────────────────────────────
    state.case_timeline.append({
        "event":     "Strategy agent completed",
        "timestamp": now,
        "actor":     "agent",
        "notes":     (
            f"Action plan generated in {duration_ms}ms via {engine_used}. "
            f"Forum: {plan.forum_selection}. "
            f"Documents to generate: {plan.document_types_required}"
        ),
    })

    return state
