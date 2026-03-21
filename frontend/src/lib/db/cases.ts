import { supabase } from '@/lib/supabase/client'
import type { Enums, Json } from '@/types/supabase'

export async function createCase(citizenId: string, payload: {
  domain: Enums<'legal_domain'>
  incident_description: string
  incident_date?: string
  incident_location?: string
  state?: string
  district?: string
  title?: string
}) {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      citizen_id: citizenId,
      ...payload,
      status: 'draft'
    })
    .select()
    .single()
  return { data, error }
}

export async function upsertChatbotCase(args: {
  caseId: string
  citizenId: string
  domain?: Enums<'legal_domain'>
  title?: string
  incident_description: string
  status?: Enums<'case_status'>
  is_seeking_lawyer?: boolean
  confidence_score?: number | null
  case_brief?: Json
  applicable_laws?: Json
  recommended_strategy?: Json
  confirmed_facts?: Json
  evidence_inventory?: Json
}) {
  const { data, error } = await supabase
    .from('cases')
    .upsert({
      id: args.caseId,
      citizen_id: args.citizenId,
      domain: args.domain ?? 'other',
      title: args.title ?? 'Untitled Legal Case',
      incident_description: args.incident_description,
      status: args.status ?? 'analysis_pending',
      is_seeking_lawyer: args.is_seeking_lawyer ?? false,
      confidence_score: args.confidence_score ?? null,
      case_brief: args.case_brief,
      applicable_laws: args.applicable_laws,
      recommended_strategy: args.recommended_strategy,
      confirmed_facts: args.confirmed_facts,
      evidence_inventory: args.evidence_inventory,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  return { data, error }
}

export async function getCitizenCases(citizenId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('citizen_id', citizenId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getCaseById(caseId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      case_documents (*),
      case_pipeline (
        *,
        lawyer_profiles (
          id,
          full_name,
          profile_photo_url,
          avg_rating,
          experience_years,
          specialisations
        )
      )
    `)
    .eq('id', caseId)
    .single()
  return { data, error }
}

export async function updateCase(caseId: string, updates: {
  title?: string
  status?: Enums<'case_status'>
  confirmed_facts?: Json
  applicable_laws?: Json
  evidence_inventory?: Json
  recommended_strategy?: Json
  case_brief?: Json
  confidence_score?: number
  analysis_duration_ms?: number
  is_seeking_lawyer?: boolean
  budget_min?: number
  budget_max?: number
  preferred_state?: string
  preferred_district?: string
}) {
  const { data, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', caseId)
    .select()
    .single()
  return { data, error }
}

export async function getOpenCasesForLawyers({
  domain,
  state,
  district,
  budget_min,
  limit = 20,
  offset = 0
}: {
  domain?: Enums<'legal_domain'>
  state?: string
  district?: string
  budget_min?: number
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('cases')
    .select('*')
    .eq('is_seeking_lawyer', true)
    .eq('status', 'seeking_lawyer')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (domain) query = query.eq('domain', domain)
  if (state) query = query.eq('state', state)
  if (district) query = query.eq('district', district)
  if (budget_min !== undefined) query = query.gte('budget_max', budget_min)

  const { data, error } = await query
  return { data, error }
}

export async function deleteCase(caseId: string) {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId)
  return { error }
}
