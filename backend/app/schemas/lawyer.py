from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from enum import Enum
from datetime import datetime
from app.schemas.domain_utils import ensure_known_domain


# ══════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════

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


class VerificationStatus(str, Enum):
    unverified = "unverified"
    pending    = "pending"
    verified   = "verified"
    rejected   = "rejected"


class CourtType(str, Enum):
    district      = "district"
    high_court    = "high_court"
    supreme_court = "supreme_court"
    tribunal      = "tribunal"
    other         = "other"


class ExperienceLevel(str, Enum):
    junior     = "Junior Advocate"
    associate  = "Associate Advocate"
    mid_level  = "Mid-Level Advocate"
    senior     = "Senior Advocate"
    principal  = "Principal Advocate"


# ══════════════════════════════════════════════════════════════
# DOMAIN LABELS
# ══════════════════════════════════════════════════════════════

DOMAIN_LABELS: dict[str, str] = {
    "criminal":              "Criminal Law",
    "family":                "Family Law",
    "divorce":               "Divorce",
    "property":              "Property Law",
    "consumer":              "Consumer Disputes",
    "cyber":                 "Cyber Crime",
    "labour":                "Labour & Employment",
    "tax":                   "Tax Law",
    "corporate":             "Corporate / Business",
    "intellectual_property": "Intellectual Property",
    "constitutional":        "Constitutional / PIL",
    "civil":                 "Civil Law",
    "tenant":                "Tenant / Rent",
    "rti":                   "RTI",
    "corruption":            "Anti-Corruption",
    "other":                 "General Practice",
}


# ══════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════════

def format_fee_range(fee_min: int | None, fee_max: int | None) -> str:
    if not fee_min and not fee_max:
        return "Fee on consultation"
    if fee_min and not fee_max:
        return f"From ₹{fee_min:,}"
    if not fee_min and fee_max:
        return f"Up to ₹{fee_max:,}"
    return f"₹{fee_min:,} – ₹{fee_max:,}"


def map_experience_to_label(years: int | None) -> str:
    if not years:        return "Junior Advocate (0–2 years)"
    if years <= 2:       return "Junior Advocate (0–2 years)"
    if years <= 5:       return "Associate Advocate (3–5 years)"
    if years <= 10:      return "Mid-Level Advocate (6–10 years)"
    if years <= 20:      return "Senior Advocate (11–20 years)"
    return "Principal Advocate (20+ years)"


def format_response_time(hours: int | None) -> str:
    if not hours:        return "Responds within 24 hours"
    if hours <= 1:       return "Responds within 1 hour"
    if hours <= 24:      return f"Responds within {hours} hours"
    days = (hours + 23) // 24
    return f"Responds within {days} day{'s' if days > 1 else ''}"


def get_primary_specialisation(specialisations: list[str] | None) -> str:
    if not specialisations:
        return "General Practice"
    return DOMAIN_LABELS.get(specialisations[0], specialisations[0])


def calculate_completeness_score(data: dict) -> int:
    weights = {
        "full_name":          10,
        "email":              5,
        "phone":              5,
        "professional_title": 5,
        "bio":                10,
        "bar_council_id":     15,
        "enrollment_number":  5,
        "state_bar_council":  5,
        "enrollment_year":    5,
        "practice_state":     5,
        "practice_district":  5,
        "specialisations":    10,
        "experience_years":   5,
        "fee_min":            5,
        "languages":          5,
    }
    score = 0
    for field, weight in weights.items():
        val = data.get(field)
        if isinstance(val, list):
            if len(val) > 0:
                score += weight
        elif val:
            score += weight
    return min(score, 100)


# ══════════════════════════════════════════════════════════════
# BASE SCHEMA
# ══════════════════════════════════════════════════════════════

class LawyerProfileBase(BaseModel):
    full_name:            Optional[str]             = None
    email:                Optional[str]             = None
    phone:                Optional[str]             = None
    professional_title:   Optional[str]             = None
    primary_category:     Optional[str]             = None
    bar_council_id:       Optional[str]             = None
    enrollment_number:    Optional[str]             = None
    state_bar_council:    Optional[str]             = None
    enrollment_year:      Optional[int]             = None
    practice_state:       Optional[str]             = None
    practice_district:    Optional[str]             = None
    court_types:          Optional[list[CourtType]] = None
    specialisations:      Optional[list[LegalDomain]] = None
    experience_years:     Optional[int]             = None
    bio:                  Optional[str]             = None
    languages:            Optional[list[str]]       = None
    fee_min:              Optional[int]             = None
    fee_max:              Optional[int]             = None
    response_time_hours:  Optional[int]             = None
    profile_photo_url:    Optional[str]             = None
    is_available:         Optional[bool]            = None

    @field_validator('specialisations', mode='before')
    @classmethod
    def normalize_specialisations(cls, v):
        if v is None:
            return v
        if not isinstance(v, list):
            raise ValueError('specialisations must be a list')

        normalized: list[str] = []
        seen: set[str] = set()
        for item in v:
            canonical = ensure_known_domain(item)
            if canonical in seen:
                continue
            seen.add(canonical)
            normalized.append(canonical)
        return normalized

    @field_validator('specialisations')
    @classmethod
    def max_five_specialisations(cls, v):
        if v and len(v) > 5:
            raise ValueError('Maximum 5 specialisations allowed')
        return v

    @field_validator('fee_min', 'fee_max')
    @classmethod
    def fees_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Fee must be a positive number')
        return v

    @field_validator('experience_years')
    @classmethod
    def experience_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Experience years must be positive')
        return v


# ══════════════════════════════════════════════════════════════
# CREATE / UPDATE
# ══════════════════════════════════════════════════════════════

class LawyerProfileCreate(LawyerProfileBase):
    full_name:  str
    email:      str


class LawyerProfileUpdate(LawyerProfileBase):
    pass


# ══════════════════════════════════════════════════════════════
# RESPONSE — full DB row + computed fields
# ══════════════════════════════════════════════════════════════

class LawyerProfileResponse(BaseModel):
    # Identity
    id:                   str
    full_name:            Optional[str]               = None
    email:                Optional[str]               = None
    phone:                Optional[str]               = None
    profile_photo_url:    Optional[str]               = None

    # Professional
    professional_title:   Optional[str]               = None
    primary_category:     Optional[str]               = None
    bar_council_id:       Optional[str]               = None
    enrollment_number:    Optional[str]               = None
    state_bar_council:    Optional[str]               = None
    enrollment_year:      Optional[int]               = None

    # Practice
    practice_state:       Optional[str]               = None
    practice_district:    Optional[str]               = None
    court_types:          Optional[list[str]]         = None
    specialisations:      Optional[list[str]]         = None

    # Experience
    experience_years:     Optional[int]               = None
    bio:                  Optional[str]               = None

    # Fees
    fee_min:              Optional[int]               = None
    fee_max:              Optional[int]               = None
    response_time_hours:  Optional[int]               = None

    # Communication
    languages:            Optional[list[str]]         = None

    # Verification
    verification_status:  Optional[str]               = None
    completeness_score:   int                         = 0

    # Stats
    is_active:            bool                        = True
    is_available:         bool                        = True
    avg_rating:           Optional[float]             = None
    total_reviews:        Optional[int]               = None
    total_cases:          Optional[int]               = None
    win_rate:             Optional[float]             = None

    # Timestamps
    created_at:           str
    updated_at:           Optional[str]               = None

    # ── Computed fields (not in DB) ────────────────────────
    verified:             bool                        = False
    verification_label:   str                         = "Unverified"
    fee_range:            str                         = "Fee on consultation"
    experience_label:     str                         = "Junior Advocate"
    response_time_label:  str                         = "Responds within 24 hours"
    primary_speciality:   str                         = "General Practice"
    domain_labels:        list[str]                   = Field(default_factory=list)

    @model_validator(mode='after')
    def compute_fields(self) -> LawyerProfileResponse:
        # Verification
        self.verified = self.verification_status == "verified"
        status_map = {
            "verified":   "Verified",
            "pending":    "Pending Verification",
            "unverified": "Unverified",
            "rejected":   "Rejected",
        }
        self.verification_label = status_map.get(
            self.verification_status or "", "Unverified"
        )

        # Fee range
        self.fee_range = format_fee_range(self.fee_min, self.fee_max)

        # Experience
        self.experience_label = map_experience_to_label(self.experience_years)

        # Response time
        self.response_time_label = format_response_time(self.response_time_hours)

        # Primary speciality
        self.primary_speciality = get_primary_specialisation(self.specialisations)

        # Domain labels
        self.domain_labels = [
            DOMAIN_LABELS.get(d, d)
            for d in (self.specialisations or [])
        ]

        return self

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════════════════════
# CARD — lightweight shape for marketplace listing
# ══════════════════════════════════════════════════════════════

class LawyerCard(BaseModel):
    id:                  str
    full_name:           str
    professional_title:  str
    primary_category:    str
    primary_speciality:  str
    domain_labels:       list[str]
    practice_state:      Optional[str]
    practice_district:   Optional[str]
    experience_years:    int
    experience_label:    str
    fee_range:           str
    fee_min:             Optional[int]
    fee_max:             Optional[int]
    avg_rating:          float
    total_reviews:       int
    verified:            bool
    verification_label:  str
    response_time_label: str
    languages:           list[str]
    profile_photo_url:   Optional[str]
    is_available:        bool

    @classmethod
    def from_profile(cls, profile: LawyerProfileResponse) -> LawyerCard:
        return cls(
            id=                  profile.id,
            full_name=           profile.full_name or "Unknown",
            professional_title=  profile.professional_title or profile.primary_speciality,
            primary_category=    profile.primary_category or profile.primary_speciality,
            primary_speciality=  profile.primary_speciality,
            domain_labels=       profile.domain_labels,
            practice_state=      profile.practice_state,
            practice_district=   profile.practice_district,
            experience_years=    profile.experience_years or 0,
            experience_label=    profile.experience_label,
            fee_range=           profile.fee_range,
            fee_min=             profile.fee_min,
            fee_max=             profile.fee_max,
            avg_rating=          profile.avg_rating or 0,
            total_reviews=       profile.total_reviews or 0,
            verified=            profile.verified,
            verification_label=  profile.verification_label,
            response_time_label= profile.response_time_label,
            languages=           profile.languages or ["en"],
            profile_photo_url=   profile.profile_photo_url,
            is_available=        profile.is_available,
        )


# ══════════════════════════════════════════════════════════════
# FILTERS — used in marketplace API query params
# ══════════════════════════════════════════════════════════════

class LawyerFilterParams(BaseModel):
    domain:         Optional[LegalDomain] = None
    state:          Optional[str]         = None
    district:       Optional[str]         = None
    budget_max:     Optional[int]         = None
    min_rating:     Optional[float]       = Field(None, ge=0, le=5)
    verified_only:  bool                  = False
    experience_min: Optional[int]         = Field(None, ge=0)
    experience_max: Optional[int]         = Field(None, ge=0)
    language:       Optional[str]         = None
    court_type:     Optional[CourtType]   = None
    search:         Optional[str]         = None
    limit:          int                   = Field(20, ge=1, le=100)
    offset:         int                   = Field(0,  ge=0)
    sort_by:        str                   = Field(
        "rating",
        pattern="^(rating|experience|fee_low|fee_high|reviews)$"
    )

    @field_validator('domain', mode='before')
    @classmethod
    def normalize_domain_filter(cls, v):
        if v is None:
            return v
        return ensure_known_domain(v)


# ══════════════════════════════════════════════════════════════
# LIST RESPONSE
# ══════════════════════════════════════════════════════════════

class LawyerListResponse(BaseModel):
    lawyers:  list[LawyerCard]
    total:    int
    limit:    int
    offset:   int
    has_more: bool
