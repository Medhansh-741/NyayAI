from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum
from app.schemas.domain_utils import ensure_known_domain


# ══════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════

class CaseStatus(str, Enum):
    draft             = "draft"
    intake_complete   = "intake_complete"
    analysis_pending  = "analysis_pending"
    analysis_complete = "analysis_complete"
    seeking_lawyer    = "seeking_lawyer"
    lawyer_matched    = "lawyer_matched"
    active            = "active"
    completed         = "completed"
    closed            = "closed"


class LegalDomain(str, Enum):
    criminal              = "criminal"
    family                = "family"
    divorce               = "divorce"
    property              = "property"
    consumer              = "consumer"
    cyber                 = "cyber"
    labour                = "labour"
    tax                   = "tax"
    corporate             = "corporate"
    intellectual_property = "intellectual_property"
    constitutional        = "constitutional"
    civil                 = "civil"
    tenant                = "tenant"
    rti                   = "rti"
    corruption            = "corruption"
    other                 = "other"
    banking_finance       = "banking_finance"
    insurance             = "insurance"
    matrimonial           = "matrimonial"
    immigration           = "immigration"
    environmental         = "environmental"
    medical_negligence    = "medical_negligence"
    motor_accident        = "motor_accident"
    cheque_bounce         = "cheque_bounce"
    debt_recovery         = "debt_recovery"
    arbitration           = "arbitration"
    service_matters       = "service_matters"
    land_acquisition      = "land_acquisition"
    wills_succession      = "wills_succession"
    domestic_violence     = "domestic_violence"
    pocso                 = "pocso"
    sc_st_atrocities      = "sc_st_atrocities"


class PipelineStatus(str, Enum):
    idle        = "idle"
    running     = "running"
    completed   = "completed"
    error       = "error"


class FactConfirmationStatus(str, Enum):
    pending   = "pending"
    confirmed = "confirmed"
    edited    = "edited"


class AgentName(str, Enum):
    intake          = "intake"
    research        = "research"
    document        = "document"
    strategy        = "strategy"
    explainability  = "explainability"


class TimelineEvent(str, Enum):
    case_created          = "case_created"
    intake_started        = "intake_started"
    intake_completed      = "intake_completed"
    facts_confirmed       = "facts_confirmed"
    research_started      = "research_started"
    research_completed    = "research_completed"
    strategy_generated    = "strategy_generated"
    document_generated    = "document_generated"
    pipeline_completed    = "pipeline_completed"
    evidence_uploaded     = "evidence_uploaded"
    lawyer_search_started = "lawyer_search_started"
    lawyer_matched        = "lawyer_matched"
    pipeline_error        = "pipeline_error"


# ══════════════════════════════════════════════════════════════
# AGENT OUTPUT SHAPES
# (what each agent writes into CaseState)
# ══════════════════════════════════════════════════════════════

class StructuredFact(BaseModel):
    incident_type:     str
    parties_involved:  list[str]
    key_dates:         list[str]
    location:          str
    state_jurisdiction:str
    summary:           str
    extracted_at:      str


class ApplicableLaw(BaseModel):
    act:            str           # BNS | BNSS | IPC | CrPC | CPC | TPA
    section:        str           # e.g. "103" | "Order 39"
    title:          str
    plain_language: str
    confidence:     float         # 0.0–1.0
    is_legacy:      bool          # true = IPC/CrPC, false = BNS/BNSS
    cross_refs:     list[str]     # related sections


class LegalMapping(BaseModel):
    applicable_laws:    list[ApplicableLaw]
    primary_act:        str
    jurisdiction:       str
    retrieved_at:       str
    overall_confidence: float


class ActionStep(BaseModel):
    step_number:  int
    title:        str
    description:  str
    urgency:      str             # low | medium | high | critical
    requires_lawyer: bool


class ActionPlan(BaseModel):
    immediate_actions:    list[ActionStep]
    legal_remedies:       list[str]
    estimated_timeline:   str
    requires_lawyer:      bool
    urgency:              str
    generated_at:         str


class ReasoningTrace(BaseModel):
    summary:              str     # plain language explanation
    key_findings:         list[str]
    confidence_score:     float
    confidence_breakdown: dict[str, float]
    disclaimer:           str
    generated_at:         str


class AgentTraceEntry(BaseModel):
    agent_name:   str
    started_at:   str
    completed_at: str
    duration_ms:  int
    status:       str             # success | error | timeout
    tokens_used:  Optional[int]  = None
    error:        Optional[str]  = None


class GeneratedDocument(BaseModel):
    document_id:  str
    doc_type:     str
    title:        str
    file_url_pdf: Optional[str] = None
    file_url_docx:Optional[str] = None
    generated_at: str


# ══════════════════════════════════════════════════════════════
# CASE STATE
# Full pipeline state object — stored in case_state table
# This is the contract between Person 1 and Person 2
# ══════════════════════════════════════════════════════════════

class CaseState(BaseModel):
    case_id:                  str
    user_id:                  str
    raw_narrative:            Optional[str]                   = None
    structured_facts:         Optional[StructuredFact]        = None
    legal_mapping:            Optional[LegalMapping]          = None
    retrieved_chunks:         Optional[list[dict]]            = None
    action_plan:              Optional[ActionPlan]            = None
    generated_documents:      Optional[list[GeneratedDocument]] = None
    reasoning_trace:          Optional[ReasoningTrace]        = None
    fact_confirmation_status: FactConfirmationStatus          = FactConfirmationStatus.pending
    agent_trace:              list[AgentTraceEntry]           = Field(default_factory=list)
    human_review_flags:       dict                            = Field(default_factory=dict)
    ocr_documents:            Optional[list[dict]]            = None
    evidence_inventory:       Optional[list[dict]]            = None
    user_feedback:            Optional[dict]                  = None
    language_preference:      str                             = "en"
    state_jurisdiction:       Optional[str]                   = None
    confidence_score:         Optional[float]                 = None
    current_agent:            Optional[AgentName]             = None
    pipeline_status:          PipelineStatus                  = PipelineStatus.idle
    created_at:               Optional[str]                   = None
    updated_at:               Optional[str]                   = None


# ══════════════════════════════════════════════════════════════
# REQUEST SCHEMAS
# What the API receives from frontend
# ══════════════════════════════════════════════════════════════

class CaseCreateRequest(BaseModel):
    domain:               LegalDomain
    raw_narrative:        str
    language_preference:  str               = "en"
    state_jurisdiction:   Optional[str]     = None
    incident_date:        Optional[str]     = None
    incident_location:    Optional[str]     = None

    @field_validator('domain', mode='before')
    @classmethod
    def normalize_domain(cls, v):
        return ensure_known_domain(v)

    @field_validator('raw_narrative')
    @classmethod
    def narrative_min_length(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Please describe your situation in more detail')
        return v.strip()


class FactConfirmRequest(BaseModel):
    confirmed_facts:  StructuredFact
    edited:           bool = False


class FeedbackRequest(BaseModel):
    section:       str
    feedback_type: str    # thumbs_up | thumbs_down
    comment:       Optional[str] = None

    @field_validator('feedback_type')
    @classmethod
    def valid_feedback_type(cls, v):
        if v not in ('thumbs_up', 'thumbs_down'):
            raise ValueError('feedback_type must be thumbs_up or thumbs_down')
        return v


class EvidenceUploadRequest(BaseModel):
    file_name:        str
    file_type:        str
    evidence_type:    Optional[str]  = None
    date_of_evidence: Optional[str]  = None


# ══════════════════════════════════════════════════════════════
# RESPONSE SCHEMAS
# What the API sends back to frontend
# ══════════════════════════════════════════════════════════════

class CaseCreateResponse(BaseModel):
    case_id:    str
    status:     CaseStatus
    created_at: str


class CaseStateResponse(BaseModel):
    case_id:          str
    status:           CaseStatus
    pipeline_status:  PipelineStatus
    current_agent:    Optional[str]
    confidence_score: Optional[float]
    structured_facts: Optional[StructuredFact]
    legal_mapping:    Optional[LegalMapping]
    action_plan:      Optional[ActionPlan]
    reasoning_trace:  Optional[ReasoningTrace]
    fact_confirmation_status: FactConfirmationStatus
    agent_trace:      list[AgentTraceEntry]
    generated_documents: Optional[list[GeneratedDocument]]


class CaseResultResponse(BaseModel):
    case_id:            str
    domain:             str
    status:             CaseStatus
    confidence_score:   Optional[float]
    structured_facts:   Optional[StructuredFact]
    applicable_laws:    Optional[list[ApplicableLaw]]
    action_plan:        Optional[ActionPlan]
    reasoning_trace:    Optional[ReasoningTrace]
    generated_documents:Optional[list[GeneratedDocument]]
    analysis_duration_ms: Optional[int]


class CaseListItem(BaseModel):
    case_id:     str
    domain:      str
    status:      CaseStatus
    title:       Optional[str]
    created_at:  str
    updated_at:  Optional[str]


class CaseListResponse(BaseModel):
    cases:    list[CaseListItem]
    total:    int


class TimelineItem(BaseModel):
    event_type:  str
    description: Optional[str]
    agent_name:  Optional[str]
    created_at:  str


class PipelineRunResponse(BaseModel):
    case_id:  str
    status:   str
    message:  str


class EvidenceResponse(BaseModel):
    evidence_id:  str
    case_id:      str
    file_url:     str
    file_name:    str
    file_type:    Optional[str]
    evidence_type:Optional[str]
    is_processed: bool
    created_at:   str


class FeedbackResponse(BaseModel):
    feedback_id: str
    case_id:     str
    section:     str
    feedback_type: str
    created_at:  str