import type { Tables } from '@/types/supabase'

export type LawyerProfile = Tables<'lawyer_profiles'>

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

export const LEGAL_DOMAINS = [
  { value: 'criminal',              label: 'Criminal Law',            icon: '⚖️' },
  { value: 'family',                label: 'Family Law',              icon: '👨‍👩‍👧' },
  { value: 'divorce',               label: 'Divorce',                 icon: '📋' },
  { value: 'property',              label: 'Property Law',            icon: '🏠' },
  { value: 'consumer',              label: 'Consumer Disputes',       icon: '🛒' },
  { value: 'cyber',                 label: 'Cyber Crime',             icon: '💻' },
  { value: 'labour',                label: 'Labour & Employment',     icon: '👷' },
  { value: 'tax',                   label: 'Tax Law',                 icon: '📊' },
  { value: 'corporate',             label: 'Corporate / Business',    icon: '🏢' },
  { value: 'intellectual_property', label: 'Intellectual Property',   icon: '💡' },
  { value: 'constitutional',        label: 'Constitutional / PIL',    icon: '📜' },
  { value: 'civil',                 label: 'Civil Law',               icon: '🏛️' },
  { value: 'tenant',                label: 'Tenant / Rent',           icon: '🔑' },
  { value: 'rti',                   label: 'RTI',                     icon: '📁' },
  { value: 'corruption',            label: 'Anti-Corruption',         icon: '🚫' },
  { value: 'banking_finance',       label: 'Banking & Finance',       icon: '💰' },
  { value: 'insurance',             label: 'Insurance Law',           icon: '🛡️' },
  { value: 'matrimonial',           label: 'Matrimonial',             icon: '💍' },
  { value: 'immigration',           label: 'Immigration',             icon: '✈️' },
  { value: 'environmental',         label: 'Environmental Law',       icon: '🌱' },
  { value: 'medical_negligence',    label: 'Medical Negligence',      icon: '🏥' },
  { value: 'motor_accident',        label: 'Motor Accident',          icon: '🚗' },
  { value: 'cheque_bounce',         label: 'Cheque Bounce',           icon: '💸' },
  { value: 'debt_recovery',         label: 'Debt Recovery',           icon: '⚖️' },
  { value: 'arbitration',           label: 'Arbitration',             icon: '🤝' },
  { value: 'service_matters',       label: 'Service Matters',         icon: '💼' },
  { value: 'land_acquisition',      label: 'Land Acquisition',        icon: '🗺️' },
  { value: 'wills_succession',      label: 'Wills & Succession',      icon: '📝' },
  { value: 'domestic_violence',     label: 'Domestic Violence',       icon: '🛡️' },
  { value: 'pocso',                 label: 'POCSO',                   icon: '⚖️' },
  { value: 'sc_st_atrocities',      label: 'SC/ST Atrocities',        icon: '⚖️' },
  { value: 'other',                 label: 'General Practice',        icon: '⚖️' },
] as const

export type LegalDomainValue = typeof LEGAL_DOMAINS[number]['value']

export const EXPERIENCE_LEVELS = [
  { label: 'Junior Advocate',             min: 0,  max: 2  },
  { label: 'Associate Advocate',          min: 3,  max: 5  },
  { label: 'Mid-Level Advocate',          min: 6,  max: 10 },
  { label: 'Senior Advocate',             min: 11, max: 20 },
  { label: 'Principal Advocate',          min: 21, max: Infinity },
] as const

export const COURT_TYPES = [
  { value: 'district',      label: 'District Court'    },
  { value: 'high_court',    label: 'High Court'        },
  { value: 'supreme_court', label: 'Supreme Court'     },
  { value: 'tribunal',      label: 'Tribunal'          },
  { value: 'other',         label: 'Other'             },
] as const

export const VERIFICATION_STATUS = [
  { value: 'verified',   label: 'Verified',    color: 'green'  },
  { value: 'pending',    label: 'Pending',     color: 'yellow' },
  { value: 'unverified', label: 'Unverified',  color: 'gray'   },
  { value: 'rejected',   label: 'Rejected',    color: 'red'    },
] as const

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry',
] as const


// ══════════════════════════════════════════════════════════════
// FORMATTERS
// ══════════════════════════════════════════════════════════════

export function formatDomain(domain: string): string {
  return LEGAL_DOMAINS.find(d => d.value === domain)?.label ?? domain
}

export function getDomainIcon(domain: string): string {
  return LEGAL_DOMAINS.find(d => d.value === domain)?.icon ?? '⚖️'
}

export function formatLawyerFeeRange(
  feeMin: number | null,
  feeMax: number | null
): string {
  if (!feeMin && !feeMax) return 'Fee on consultation'
  if (feeMin && !feeMax)  return `From ₹${feeMin.toLocaleString('en-IN')}`
  if (!feeMin && feeMax)  return `Up to ₹${feeMax.toLocaleString('en-IN')}`
  return `₹${feeMin!.toLocaleString('en-IN')} – ₹${feeMax!.toLocaleString('en-IN')}`
}

export function formatResponseTime(hours: number | null): string {
  if (!hours)      return 'Responds within 24 hours'
  if (hours < 1)   return 'Responds within 1 hour'
  if (hours === 1) return 'Responds within 1 hour'
  if (hours <= 24) return `Responds within ${hours} hours`
  const days = Math.ceil(hours / 24)
  return `Responds within ${days} day${days > 1 ? 's' : ''}`
}

export function formatCourtType(court: string): string {
  return COURT_TYPES.find(c => c.value === court)?.label ?? court
}

export function formatCourtTypes(courts: string[] | null): string {
  if (!courts || courts.length === 0) return 'District Court'
  return courts.map(formatCourtType).join(', ')
}

export function formatLanguages(languages: string[] | null): string {
  const map: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    bn: 'Bengali',
    gu: 'Gujarati',
    pa: 'Punjabi',
    or: 'Odia',
    as: 'Assamese',
  }
  if (!languages || languages.length === 0) return 'English'
  return languages.map(l => map[l] ?? l).join(', ')
}

export function formatRating(rating: number | null): string {
  if (!rating) return 'No reviews yet'
  return rating.toFixed(1)
}

export function formatWinRate(rate: number | null): string {
  if (!rate) return 'N/A'
  return `${rate.toFixed(0)}%`
}

export function formatEnrollmentYear(year: number | null): string {
  if (!year) return 'Year not specified'
  return `Enrolled ${year}`
}


// ══════════════════════════════════════════════════════════════
// MAPPERS
// ══════════════════════════════════════════════════════════════

export function mapExperienceToLabel(years: number | null): string {
  if (years === null || years === undefined) return 'Junior Advocate'
  const level = EXPERIENCE_LEVELS.find(
    l => years >= l.min && years <= l.max
  )
  if (!level) return 'Junior Advocate'
  if (years <= 2)  return `Junior Advocate (0–2 years)`
  if (years <= 5)  return `Associate Advocate (3–5 years)`
  if (years <= 10) return `Mid-Level Advocate (6–10 years)`
  if (years <= 20) return `Senior Advocate (11–20 years)`
  return `Principal Advocate (20+ years)`
}

export function mapExperienceToShortLabel(years: number | null): string {
  if (!years)      return 'Junior'
  if (years <= 2)  return 'Junior'
  if (years <= 5)  return 'Associate'
  if (years <= 10) return 'Mid-Level'
  if (years <= 20) return 'Senior'
  return 'Principal'
}

export function getPrimarySpecialisation(
  specialisations: string[] | null
): string {
  if (!specialisations || specialisations.length === 0) return 'General Practice'
  return formatDomain(specialisations[0])
}

export function isVerified(status: string | null): boolean {
  return status === 'verified'
}

export function getVerificationLabel(status: string | null): string {
  return VERIFICATION_STATUS.find(v => v.value === status)?.label ?? 'Unverified'
}

export function getVerificationColor(status: string | null): string {
  return VERIFICATION_STATUS.find(v => v.value === status)?.color ?? 'gray'
}


// ══════════════════════════════════════════════════════════════
// CARD MAPPER — maps DB row → UI card shape
// ══════════════════════════════════════════════════════════════

export interface LawyerCard {
  // Identity
  id:                 string
  fullName:           string
  email:              string
  phone:              string | null
  photoUrl:           string | null

  // Professional
  professionalTitle:  string
  primaryCategory:    string
  barCouncilId:       string | null
  enrollmentNumber:   string | null
  stateBarCouncil:    string | null
  enrollmentYear:     number | null
  enrollmentYearLabel:string

  // Practice
  practiceState:      string | null
  practiceDistrict:   string | null
  courtTypes:         string[]
  courtTypesLabel:    string
  specialisations:    string[]
  primarySpeciality:  string
  domainIcons:        string[]

  // Experience
  experienceYears:    number
  experienceLabel:    string
  experienceShort:    string

  // Fees
  feeMin:             number | null
  feeMax:             number | null
  priceRange:         string

  // Communication
  languages:          string[]
  languagesLabel:     string
  responseTimeHours:  number
  responseTimeLabel:  string

  // Verification
  verificationStatus: string
  verified:           boolean
  verificationLabel:  string
  verificationColor:  string

  // Stats
  completenessScore:  number
  avgRating:          number
  ratingLabel:        string
  totalReviews:       number
  totalCases:         number
  winRate:            number
  winRateLabel:       string

  // Availability
  isActive:           boolean
  isAvailable:        boolean

  // Bio
  bio:                string | null

  // Meta
  createdAt:          string
  updatedAt:          string | null
}

export function mapLawyerToCard(lawyer: LawyerProfile): LawyerCard {
  return {
    // Identity
    id:                  lawyer.id,
    fullName:            lawyer.full_name ?? 'Unknown',
    email:               lawyer.email ?? '',
    phone:               lawyer.phone,
    photoUrl:            lawyer.profile_photo_url,

    // Professional
    professionalTitle:   lawyer.professional_title
                           ?? getPrimarySpecialisation(lawyer.specialisations),
    primaryCategory:     lawyer.primary_category
                           ?? getPrimarySpecialisation(lawyer.specialisations),
    barCouncilId:        lawyer.bar_council_id,
    enrollmentNumber:    lawyer.enrollment_number,
    stateBarCouncil:     lawyer.state_bar_council,
    enrollmentYear:      lawyer.enrollment_year,
    enrollmentYearLabel: formatEnrollmentYear(lawyer.enrollment_year),

    // Practice
    practiceState:       lawyer.practice_state,
    practiceDistrict:    lawyer.practice_district,
    courtTypes:          lawyer.court_types ?? [],
    courtTypesLabel:     formatCourtTypes(lawyer.court_types),
    specialisations:     lawyer.specialisations ?? [],
    primarySpeciality:   getPrimarySpecialisation(lawyer.specialisations),
    domainIcons:         (lawyer.specialisations ?? []).map(getDomainIcon),

    // Experience
    experienceYears:     lawyer.experience_years ?? 0,
    experienceLabel:     mapExperienceToLabel(lawyer.experience_years),
    experienceShort:     mapExperienceToShortLabel(lawyer.experience_years),

    // Fees
    feeMin:              lawyer.fee_min,
    feeMax:              lawyer.fee_max,
    priceRange:          formatLawyerFeeRange(lawyer.fee_min, lawyer.fee_max),

    // Communication
    languages:           lawyer.languages ?? ['en'],
    languagesLabel:      formatLanguages(lawyer.languages),
    responseTimeHours:   lawyer.response_time_hours ?? 24,
    responseTimeLabel:   formatResponseTime(lawyer.response_time_hours),

    // Verification
    verificationStatus:  lawyer.verification_status ?? 'unverified',
    verified:            isVerified(lawyer.verification_status),
    verificationLabel:   getVerificationLabel(lawyer.verification_status),
    verificationColor:   getVerificationColor(lawyer.verification_status),

    // Stats
    completenessScore:   lawyer.completeness_score ?? 0,
    avgRating:           lawyer.avg_rating ?? 0,
    ratingLabel:         formatRating(lawyer.avg_rating),
    totalReviews:        lawyer.total_reviews ?? 0,
    totalCases:          lawyer.total_cases ?? 0,
    winRate:             lawyer.win_rate ?? 0,
    winRateLabel:        formatWinRate(lawyer.win_rate),

    // Availability
    isActive:            lawyer.is_active ?? true,
    isAvailable:         lawyer.is_available ?? true,

    // Bio
    bio:                 lawyer.bio,

    // Meta
    createdAt:           lawyer.created_at ?? new Date().toISOString(),
    updatedAt:           lawyer.updated_at,
  }
}


// ══════════════════════════════════════════════════════════════
// FILTERS
// ══════════════════════════════════════════════════════════════

export interface LawyerFilterParams {
  domain?:         string
  state?:          string
  district?:       string
  budget_max?:     number
  min_rating?:     number
  verified_only?:  boolean
  experience_min?: number
  experience_max?: number
  language?:       string
  court_type?:     string
  search?:         string
}

export function filterLawyerCards(
  lawyers: LawyerCard[],
  filters: LawyerFilterParams
): LawyerCard[] {
  return lawyers.filter(lawyer => {
    if (filters.domain && !lawyer.specialisations.includes(filters.domain)) {
      return false
    }
    if (filters.state && lawyer.practiceState !== filters.state) {
      return false
    }
    if (filters.district && lawyer.practiceDistrict !== filters.district) {
      return false
    }
    if (filters.budget_max && lawyer.feeMin && lawyer.feeMin > filters.budget_max) {
      return false
    }
    if (filters.min_rating && lawyer.avgRating < filters.min_rating) {
      return false
    }
    if (filters.verified_only && !lawyer.verified) {
      return false
    }
    if (filters.experience_min && lawyer.experienceYears < filters.experience_min) {
      return false
    }
    if (filters.experience_max && lawyer.experienceYears > filters.experience_max) {
      return false
    }
    if (filters.language && !lawyer.languages.includes(filters.language)) {
      return false
    }
    if (filters.court_type && !lawyer.courtTypes.includes(filters.court_type)) {
      return false
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match =
        lawyer.fullName.toLowerCase().includes(q) ||
        lawyer.bio?.toLowerCase().includes(q) ||
        lawyer.primaryCategory.toLowerCase().includes(q) ||
        lawyer.specialisations.some(s => formatDomain(s).toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })
}

export function sortLawyerCards(
  lawyers: LawyerCard[],
  sortBy: 'rating' | 'experience' | 'fee_low' | 'fee_high' | 'reviews'
): LawyerCard[] {
  return [...lawyers].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.avgRating - a.avgRating
      case 'experience':
        return b.experienceYears - a.experienceYears
      case 'fee_low':
        return (a.feeMin ?? 0) - (b.feeMin ?? 0)
      case 'fee_high':
        return (b.feeMax ?? 0) - (a.feeMax ?? 0)
      case 'reviews':
        return b.totalReviews - a.totalReviews
      default:
        return b.avgRating - a.avgRating
    }
  })
}


// ══════════════════════════════════════════════════════════════
// COMPLETENESS SCORE CALCULATOR
// (mirrors backend logic — use for profile builder UI)
// ══════════════════════════════════════════════════════════════

export function calculateCompletenessScore(lawyer: Partial<LawyerProfile>): number {
  const fields: { key: keyof LawyerProfile; weight: number }[] = [
    { key: 'full_name',           weight: 10 },
    { key: 'email',               weight: 5  },
    { key: 'phone',               weight: 5  },
    { key: 'professional_title',  weight: 5  },
    { key: 'bio',                 weight: 10 },
    { key: 'bar_council_id',      weight: 15 },
    { key: 'enrollment_number',   weight: 5  },
    { key: 'state_bar_council',   weight: 5  },
    { key: 'enrollment_year',     weight: 5  },
    { key: 'practice_state',      weight: 5  },
    { key: 'practice_district',   weight: 5  },
    { key: 'specialisations',     weight: 10 },
    { key: 'experience_years',    weight: 5  },
    { key: 'fee_min',             weight: 5  },
    { key: 'languages',           weight: 5  },
  ]

  let score = 0
  for (const field of fields) {
    const val = lawyer[field.key]
    if (Array.isArray(val) ? val.length > 0 : !!val) {
      score += field.weight
    }
  }
  return Math.min(score, 100)
}
