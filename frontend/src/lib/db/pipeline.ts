import { supabase } from '@/lib/supabase/client'
import type { Enums } from '@/types/supabase'

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
  // Accept the offer
  const { data, error } = await supabase
    .from('case_pipeline')
    .update({
      stage: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', pipelineId)
    .select()
    .single()

  if (error) return { data, error }

  // Update case status
  await supabase
    .from('cases')
    .update({
      status: 'lawyer_matched',
      lawyer_matched_at: new Date().toISOString(),
      is_seeking_lawyer: false,
    })
    .eq('id', caseId)

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
