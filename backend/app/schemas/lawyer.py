from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class LegalDomain(str, Enum):
    consumer              = "consumer"
    tenant                = "tenant"
    labour                = "labour"
    criminal              = "criminal"
    cyber                 = "cyber"
    property              = "property"
    family                = "family"
    rti                   = "rti"
    corruption            = "corruption"
    civil                 = "civil"
    tax                   = "tax"
    corporate             = "corporate"
    intellectual_property = "intellectual_property"
    constitutional        = "constitutional"
    other                 = "other"


class VerificationStatus(str, Enum):
    unverified = "unverified"
    pending    = "pending"
    verified   = "verified"
    rejected   = "rejected"


class LawyerProfileResponse(BaseModel):
    id:                   str
    full_name:            Optional[str]
    email:                Optional[str]
    phone:                Optional[str]
    professional_title:   Optional[str]
    primary_category:     Optional[str]
    bar_council_id:       Optional[str]
    practice_state:       Optional[str]
    practice_district:    Optional[str]
    court_types:          Optional[list[str]]
    specialisations:      Optional[list[LegalDomain]]
    experience_years:     Optional[int]
    bio:                  Optional[str]
    languages:            Optional[list[str]]
    fee_min:              Optional[int]
    fee_max:              Optional[int]
    response_time_hours:  Optional[int]
    profile_photo_url:    Optional[str]
    verification_status:  Optional[VerificationStatus]
    completeness_score:   int
    is_active:            bool
    is_available:         bool
    avg_rating:           Optional[float]
    total_cases:          Optional[int]
    win_rate:             Optional[float]
    total_reviews:        Optional[int]
    created_at:           str
    updated_at:           Optional[str]

    # Computed fields (not in DB — added by API)
    verified:             bool = Field(default=False)
    fee_range:            Optional[str] = None
    experience_label:     Optional[str] = None
    response_time_label:  Optional[str] = None

    def model_post_init(self, __context):
        self.verified = self.verification_status == VerificationStatus.verified

        if self.fee_min and self.fee_max:
            self.fee_range = f"₹{self.fee_min:,} – ₹{self.fee_max:,}"

        years = self.experience_years or 0
        if years <= 2:   self.experience_label = "Junior Advocate"
        elif years <= 5: self.experience_label = "Associate Advocate (3–5 years)"
        elif years <= 10:self.experience_label = "Mid-Level Advocate (6–10 years)"
        elif years <= 20:self.experience_label = "Senior Advocate (11–20 years)"
        else:            self.experience_label = "Principal Advocate (20+ years)"

        hours = self.response_time_hours or 24
        if hours <= 1:   self.response_time_label = "Responds within 1 hour"
        elif hours <= 24:self.response_time_label = f"Responds within {hours} hours"
        else:            self.response_time_label = f"Responds within {hours // 24} days"


class LawyerProfileUpdate(BaseModel):
    full_name:           Optional[str] = None
    professional_title:  Optional[str] = None
    primary_category:    Optional[str] = None
    phone:               Optional[str] = None
    bar_council_id:      Optional[str] = None
    practice_state:      Optional[str] = None
    practice_district:   Optional[str] = None
    court_types:         Optional[list[str]] = None
    specialisations:     Optional[list[LegalDomain]] = None
    experience_years:    Optional[int] = None
    bio:                 Optional[str] = None
    languages:           Optional[list[str]] = None
    fee_min:             Optional[int] = None
    fee_max:             Optional[int] = None
    response_time_hours: Optional[int] = None
    is_available:        Optional[bool] = None