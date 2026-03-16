import type { Tables } from '@/types/supabase'

type LawyerProfile = Tables<'lawyer_profiles'>

// ── Fee Range ─────────────────────────────────────────────
export function formatLawyerFeeRange(
    feeMin: number | null,
    feeMax: number | null
): string {
    if (!feeMin && !feeMax) return 'Fee on consultation'
    if (feeMin && !feeMax) return `From ₹${feeMin.toLocaleString('en-IN')}`
    if (!feeMin && feeMax) return `Up to ₹${feeMax.toLocaleString('en-IN')}`
    return `₹${feeMin!.toLocaleString('en-IN')} – ₹${feeMax!.toLocaleString('en-IN')}`
}

// ── Experience Label ──────────────────────────────────────
export function mapExperienceToLabel(years: number | null): string {
    if (!years) return 'Junior Advocate'
    if (years <= 2) return 'Junior Advocate (0–2 years)'
    if (years <= 5) return 'Associate Advocate (3–5 years)'
    if (years <= 10) return 'Mid-Level Advocate (6–10 years)'
    if (years <= 20) return 'Senior Advocate (11–20 years)'
    return 'Principal Advocate (20+ years)'
}

// ── Primary Specialisation ────────────────────────────────
export function getPrimarySpecialisation(
    specialisations: string[] | null
): string {
    if (!specialisations || specialisations.length === 0) return 'General Practice'
    return formatDomain(specialisations[0])
}

// ── Verification Flag ─────────────────────────────────────
export function isVerified(
    status: string | null
): boolean {
    return status === 'verified'
}

// ── Response Time Label ───────────────────────────────────
export function formatResponseTime(hours: number | null): string {
    if (!hours) return 'Responds within 24 hours'
    if (hours < 1) return 'Responds within 1 hour'
    if (hours === 1) return 'Responds within 1 hour'
    if (hours <= 24) return `Responds within ${hours} hours`
    const days = Math.ceil(hours / 24)
    return `Responds within ${days} day${days > 1 ? 's' : ''}`
}

// ── Domain Label Formatter ────────────────────────────────
export function formatDomain(domain: string): string {
    const map: Record<string, string> = {
        consumer: 'Consumer Law',
        tenant: 'Tenant / Rent',
        labour: 'Labour & Employment',
        criminal: 'Criminal Law',
        cyber: 'Cyber Law',
        property: 'Property Law',
        family: 'Family Law',
        rti: 'RTI',
        corruption: 'Anti-Corruption',
        civil: 'Civil Law',
        tax: 'Tax Law',
        corporate: 'Corporate / Business',
        intellectual_property: 'Intellectual Property',
        constitutional: 'Constitutional / PIL',
        other: 'General Practice'
    }
    return map[domain] ?? domain
}

// ── Map full LawyerProfile to UI shape ───────────────────
export function mapLawyerToCard(lawyer: LawyerProfile) {
    return {
        id: lawyer.id,
        name: lawyer.full_name ?? 'Unknown',
        title: lawyer.professional_title ?? getPrimarySpecialisation(lawyer.specialisations),
        primaryCategory: lawyer.primary_category ?? getPrimarySpecialisation(lawyer.specialisations),
        specialisations: lawyer.specialisations ?? [],
        specialty: getPrimarySpecialisation(lawyer.specialisations),
        priceRange: formatLawyerFeeRange(lawyer.fee_min, lawyer.fee_max),
        experienceLabel: mapExperienceToLabel(lawyer.experience_years),
        experienceYears: lawyer.experience_years ?? 0,
        verified: isVerified(lawyer.verification_status),
        rating: lawyer.avg_rating ?? 0,
        responseTime: formatResponseTime(lawyer.response_time_hours),
        photoUrl: lawyer.profile_photo_url,
        state: lawyer.practice_state,
        district: lawyer.practice_district,
        languages: lawyer.languages ?? ['en'],
        feeMin: lawyer.fee_min,
        feeMax: lawyer.fee_max,
        isAvailable: lawyer.is_available,
    }
}

export type LawyerCard = ReturnType<typeof mapLawyerToCard>