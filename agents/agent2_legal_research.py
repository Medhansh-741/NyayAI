import logging

from case_state import (
    CaseState,
    LegalMapping,
    LegalSection,
    RetrievedChunk,
    IpcCrossRef
)

# Dummy base agent class so we don't need a separate relative import
class BaseAgent:
    def run(self, case_state: CaseState) -> CaseState:
        return case_state

def agent2(case_state: dict):
    agent = LegalResearchAgent()
    
    # Needs to be a Pydantic object for the class method
    if isinstance(case_state, dict):
        pydantic_state = CaseState(**case_state)
    else:
        pydantic_state = case_state
        
    out = agent.run(pydantic_state)
    return out.model_dump()

from retrieval import search_law
from state_variations import get_state_law
from bns_ipc_crossref import get_ipc_equivalent


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LegalResearchAgent(BaseAgent):

    def run(self, case_state: CaseState) -> CaseState:

        incident = case_state.structured_facts

        if incident is None:
            logger.warning("structured_facts missing — Agent1 must run first")
            return case_state

        facts_text = " ".join(incident.key_facts) if incident.key_facts else ""

        logger.info(f"Running legal research for: {facts_text}")

        results = search_law(facts_text)

        sections = []
        bns_bnss_sections = []
        retrieved_chunks = []
        cross_refs = []

        for r in results:

            if r["score"] < 0.40:
                continue

            # ── Store retrieved chunk for RAG trace ──────────────────────────
            retrieved_chunks.append(
                RetrievedChunk(
                    section_ref=f"{r['act']} Section {r['section']}",
                    act_name=r["act"],
                    text=r["text"],
                    confidence="medium"
                )
            )

            # ── Legal section mapping ────────────────────────────────────────
            mapped_section = LegalSection(
                section_ref=f"{r['act']} Section {r['section']}",
                act_name=r['act'],
                description=r["text"],
                confidence="medium"
            )

            if r["act"] in ("bns_2023", "bnss_2023"):
                bns_bnss_sections.append(mapped_section)
            else:
                sections.append(mapped_section)

            # ── BNS ↔ IPC cross reference ────────────────────────────────────
            if r["act"] == "bns_2023":

                ipc_equiv = get_ipc_equivalent(r["section"])

                if ipc_equiv:

                    cross_refs.append(
                        IpcCrossRef(
                            old_ref=f"IPC Section {ipc_equiv}",
                            new_ref=f"BNS Section {r['section']}",
                            act_old="IPC 1860",
                            act_new="BNS 2023"
                        )
                    )

        # ── No law found ─────────────────────────────────────────────────────
        if not sections and not bns_bnss_sections:

            case_state.legal_mapping = LegalMapping(
                applicable_sections=[],
                bns_bnss_sections=[],
                legal_standing_score="weak"
            )

            case_state.retrieved_chunks = retrieved_chunks

            return case_state

        # ── Standing score heuristic ─────────────────────────────────────────
        total_sections = len(sections) + len(bns_bnss_sections)
        if total_sections >= 4:
            standing = "strong"
        elif total_sections >= 2:
            standing = "moderate"
        else:
            standing = "weak"

        # ── State law variations ─────────────────────────────────────────────
        state_variations = []

        if case_state.state_jurisdiction:
            state_law = get_state_law(case_state.state_jurisdiction)
            state_variations.extend(state_law)

        # ── Write mapping ────────────────────────────────────────────────────
        case_state.legal_mapping = LegalMapping(
            applicable_sections=sections[:5],
            bns_bnss_sections=bns_bnss_sections[:5],
            ipc_crpc_crossref=cross_refs,
            state_specific_variations=state_variations,
            legal_standing_score=standing
        )

        case_state.retrieved_chunks = retrieved_chunks

        case_state.state_jurisdiction = case_state.state_jurisdiction or ""

        return case_state