from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal
import uuid


# ── Agent 1 sub-models ────────────────────────────────────────────────────────

class Party(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None   # "complainant" | "respondent" | "unknown"
    contact: Optional[str] = None
    description: Optional[str] = None

class StructuredFacts(BaseModel):
    incident_type: Optional[str] = None
    incident_summary: Optional[str] = None
    incident_date: Optional[str] = None
    parties: list[Party] = Field(default_factory=list)
    timeline: list[str] = Field(default_factory=list)
    urgency_level: Literal["immediate", "standard", "low"] = "standard"
    key_facts: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    dispute_context: Optional[str] = None

class EvidenceItem(BaseModel):
    evidence_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    file_reference: Optional[str] = None
    evidence_type: str
    date_of_evidence: Optional[str] = None
    relevance_score: float = 0.0
    description: str = ""
    ocr_text: Optional[str] = None
    tags: list[str] = Field(default_factory=list)

class OcrDocument(BaseModel):
    file_ref: Optional[str] = None
    type: Optional[str] = None
    extracted_text: Optional[str] = None
    date_detected: Optional[str] = None


# ── Agent 2 sub-models ────────────────────────────────────────────────────────

class LegalSection(BaseModel):
    section_ref: str
    act_name: str
    description: Optional[str] = None
    confidence: Literal["high", "medium", "low"] = "medium"

class IpcCrossRef(BaseModel):
    old_ref: str
    new_ref: str
    act_old: str
    act_new: str

class LandmarkCase(BaseModel):
    citation: str
    summary: Optional[str] = None
    relevance: Optional[str] = None

class RetrievedChunk(BaseModel):
    section_ref: str
    act_name: str
    text: str
    source_url: Optional[str] = None
    version_date: Optional[str] = None
    last_verified: Optional[str] = None
    confidence: Literal["high", "medium", "low"] = "medium"

class LegalMapping(BaseModel):
    applicable_sections: list[LegalSection] = Field(default_factory=list)
    bns_bnss_sections: list[LegalSection] = Field(default_factory=list)
    ipc_crpc_crossref: list[IpcCrossRef] = Field(default_factory=list)
    landmark_cases: list[LandmarkCase] = Field(default_factory=list)
    legal_standing_score: Literal["strong", "moderate", "weak"] = "moderate"
    state_specific_variations: list[str] = Field(default_factory=list)


# ── Agent 3 sub-models ────────────────────────────────────────────────────────

class ActionStep(BaseModel):
    step: str
    description: str
    deadline: Optional[str] = None
    priority: Literal["high", "medium", "low"] = "medium"

class ActionPlan(BaseModel):
    immediate: list[ActionStep] = Field(default_factory=list)
    medium_term: list[ActionStep] = Field(default_factory=list)
    forum_selection: Optional[str] = None
    forum_selection_reason: Optional[str] = None
    escalation_path: Optional[str] = None
    timeline_estimate: Optional[str] = None
    cost_estimate: Optional[str] = None
    lawyer_recommended: bool = False
    lawyer_recommended_reason: Optional[str] = None
    evidence_checklist: list[str] = Field(default_factory=list)
    avoid_list: list[str] = Field(default_factory=list)
    mediation_recommended: bool = False
    mediation_reason: Optional[str] = None
    document_types_required: list[str] = Field(default_factory=list)
    demand_amount: Optional[str] = None
    relief_sought: Optional[str] = None


# ── Agent 4 sub-models ────────────────────────────────────────────────────────

class GeneratedDoc(BaseModel):
    content_md: Optional[str] = None
    docx_url: Optional[str] = None
    pdf_url: Optional[str] = None
    disclaimer_included: bool = True

class GeneratedDocuments(BaseModel):
    legal_notice: Optional[GeneratedDoc] = None
    consumer_complaint: Optional[GeneratedDoc] = None
    fir_draft: Optional[GeneratedDoc] = None
    rti_application: Optional[GeneratedDoc] = None
    affidavit: Optional[GeneratedDoc] = None
    corruption_complaint: Optional[GeneratedDoc] = None
    lawyer_brief: Optional[GeneratedDoc] = None


# ── Agent 5 sub-models ────────────────────────────────────────────────────────

class SectionConfidence(BaseModel):
    section_ref: str
    confidence: Literal["high", "medium", "low"]
    reason: Optional[str] = None

class ReasoningTrace(BaseModel):
    per_section_confidence: list[SectionConfidence] = Field(default_factory=list)
    agent_logs: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)
    overall_confidence: Literal["high", "medium", "low"] = "medium"
    legal_standing_breakdown: Optional[str] = None


# ── Master CaseState ──────────────────────────────────────────────────────────

class CaseState(BaseModel):
    # Identity
    case_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    language_preference: Literal["hindi", "english", "hinglish"] = "english"

    # Agent 1
    raw_narrative: str = ""
    uploaded_files: list[str] = Field(default_factory=list)
    ocr_documents: list[OcrDocument] = Field(default_factory=list)
    evidence_inventory: list[EvidenceItem] = Field(default_factory=list)
    structured_facts: Optional[StructuredFacts] = None
    state_jurisdiction: Optional[str] = None
    fact_confirmation_status: Literal["pending", "confirmed", "corrected"] = "pending"
    intake_status: Literal["collecting_info", "awaiting_user_response", "complete"] = "collecting_info"
    follow_up_questions: list[str] = Field(default_factory=list)
    conversational_response: Optional[str] = None

    # Agent 2
    legal_mapping: Optional[LegalMapping] = None
    retrieved_chunks: list[RetrievedChunk] = Field(default_factory=list)

    # Agent 3
    action_plan: Optional[ActionPlan] = None

    # Agent 4
    generated_documents: Optional[GeneratedDocuments] = None

    # Agent 5
    reasoning_trace: Optional[ReasoningTrace] = None

    # System fields
    agent_trace: list = Field(default_factory=list)
    human_review_flags: list[str] = Field(default_factory=list)
    case_timeline: list = Field(default_factory=list)
    user_feedback: dict = Field(default_factory=dict)

    class Config:
        extra = "ignore"