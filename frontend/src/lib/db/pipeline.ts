import { supabase } from '@/lib/supabase/client'
import type { Enums } from '@/types/supabase'
import { createNotification } from '@/lib/db/notifications'
import { getBackendUrl } from '@/lib/utils/backendUrl'

const BACKEND_URL = getBackendUrl()
const ACCEPT_OFFER_TIMEOUT_MS = 12000

function mapAcceptOfferNetworkError(error: unknown): Error {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('Accept offer request timed out. Please try again.')
  }

  if (error instanceof TypeError || (error instanceof Error && /failed to fetch/i.test(error.message))) {
    return new Error(`Unable to reach the case service at ${BACKEND_URL}. Please check backend connectivity and try again.`)
  }

  if (error instanceof Error) {
    return new Error('Could not complete offer acceptance due to a network issue. Please try again.')
  }

  return new Error('Could not complete offer acceptance right now. Please try again.')
}

export async function createOffer(lawyerId: string, payload: {
  case_id: string
  offer_amount: number
  offer_note?: string
}) {
  const { data, error } = await supabase
    .from('case_pipeline')
    .insert({
      lawyer_id: lawyerId,
      ...payload,
      stage: 'offered',
      offer_sent_at: new Date().toISOString()
    })
    .select()
    .single()
  return { data, error }
}

export async function getLawyerPipeline(lawyerId: string, stage?: Enums<'pipeline_stage'>) {
  let query = supabase
    .from('case_pipeline')
    .select(`
      *,
      cases (
        id,
        title,
        domain,
        status,
        state,
        district,
        incident_description,
        budget_min,
        budget_max,
        created_at
      )
    `)
    .eq('lawyer_id', lawyerId)
    .order('created_at', { ascending: false })

  if (stage) {
    query = query.eq('stage', stage)
  }

  const { data, error } = await query
  return { data, error }
}

export async function updatePipelineStage(pipelineId: string, stage: Enums<'pipeline_stage'>, extras?: {
  outcome?: Enums<'case_outcome'>
  next_milestone?: string
  lawyer_notes?: string
  show_on_profile?: boolean
}) {
  const updates: Record<string, unknown> = { stage, ...extras }

  if (stage === 'accepted') updates.accepted_at = new Date().toISOString()
  if (stage === 'completed') updates.completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('case_pipeline')
    .update(updates)
    .eq('id', pipelineId)
    .select()
    .single()
  return { data, error }
}

export async function withdrawOffer(pipelineId: string) {
  const { data, error } = await supabase
    .from('case_pipeline')
    .update({ stage: 'withdrawn' })
    .eq('id', pipelineId)
    .select()
    .single()
  return { data, error }
}

export async function acceptOffer(pipelineId: string, caseId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    return { data: null, error: sessionError || new Error('You must be logged in to accept an offer.') }
  }

  let timeout: ReturnType<typeof setTimeout> | null = null
  try {
    const controller = new AbortController()
    timeout = setTimeout(() => controller.abort(), ACCEPT_OFFER_TIMEOUT_MS)

    const response = await fetch(`${BACKEND_URL}/pipeline/accept-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        pipeline_id: pipelineId,
        case_id: caseId,
      }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      let message = typeof payload?.detail === 'string' ? payload.detail : 'Failed to accept offer.'
      if (response.status === 401 || response.status === 403) {
        message = 'Your session expired. Please sign in again to accept this offer.'
      } else if (response.status >= 500) {
        message = 'Case service is temporarily unavailable. Please try again shortly.'
      }
      return { data: null, error: new Error(message) }
    }

    return { data: payload?.pipeline ?? null, error: null }
  } catch (error) {
    return {
      data: null,
      error: mapAcceptOfferNetworkError(error),
    }
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function acceptAvailableCase(caseId: string, lawyerId: string, note?: string) {
  // Prevent duplicate assignment (best-effort; DB should enforce if desired)
  const { data: existing, error: existingErr } = await supabase
    .from('case_pipeline')
    .select('id')
    .eq('case_id', caseId)
    .limit(1)

  if (existingErr) return { data: null, error: existingErr }
  if (existing && existing.length > 0) {
    return { data: null, error: new Error('This case has already been picked up.') }
  }

  const { data: caseRow, error: caseReadErr } = await supabase
    .from('cases')
    .select('id, title, citizen_id')
    .eq('id', caseId)
    .maybeSingle()

  if (caseReadErr || !caseRow) {
    return { data: null, error: caseReadErr || new Error('Case not found.') }
  }

  const { data, error } = await supabase
    .from('case_pipeline')
    .insert({
      case_id: caseId,
      lawyer_id: lawyerId,
      stage: 'accepted',
      accepted_at: new Date().toISOString(),
      offer_note: note ?? 'Lawyer picked up this available case.',
    })
    .select()
    .single()

  if (error) return { data, error }

  await supabase
    .from('cases')
    .update({
      status: 'lawyer_matched',
      lawyer_matched_at: new Date().toISOString(),
      is_seeking_lawyer: false,
    })
    .eq('id', caseId)

  if (caseRow.citizen_id) {
    await createNotification({
      user_id: caseRow.citizen_id,
      type: 'offer_accepted',
      title: 'Lawyer matched for your case',
      body: `A lawyer has accepted your case: ${caseRow.title ?? 'Untitled'}.`,
      data: {
        case_id: caseId,
        pipeline_id: data?.id,
        lawyer_id: lawyerId
      }
    })
  }

  return { data, error }
}

export async function getCasePipelineForCitizen(caseId: string) {
  const { data, error } = await supabase
    .from('case_pipeline')
    .select(`
      *,
      lawyer_profiles (
        id,
        full_name,
        profile_photo_url,
        avg_rating,
        experience_years,
        specialisations,
        practice_state,
        fee_min,
        fee_max
      )
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getPendingOffersCount(caseIds: string[]) {
  if (caseIds.length === 0) return { data: {}, error: null }

  const { data, error } = await supabase
    .from('case_pipeline')
    .select('case_id')
    .in('case_id', caseIds)
    .eq('stage', 'offered')

  if (error) return { data: null, error }

  const counts: Record<string, number> = {}
  data.forEach(row => {
    counts[row.case_id] = (counts[row.case_id] || 0) + 1
  })

  return { data: counts, error: null }
}
