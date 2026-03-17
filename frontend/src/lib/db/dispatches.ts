import { supabase } from '@/lib/supabase/client'

type UntypedSupabase = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

export type CitizenInputs = {
  budget_min?: number
  budget_max?: number
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
  engagement_type?: 'FULL_CASE' | 'CONSULTATION' | 'DOCUMENT_REVIEW'
  case_goal?: string
  stage?: string
  preferred_language?: string
  communication_mode?: 'CHAT_FIRST' | 'CALL_FIRST'
  notes?: string
}

export type BriefDispatchInsert = {
  case_id: string
  citizen_id: string
  lawyer_id: string
  intro_message: string
  ai_brief?: unknown
  citizen_inputs?: CitizenInputs
  documents?: unknown[]
}

export async function createBriefDispatch(payload: BriefDispatchInsert) {
  const client = supabase as unknown as UntypedSupabase
  const { data, error } = await client
    .from('brief_dispatches')
    .insert({
      ...payload,
      ai_brief: payload.ai_brief ?? null,
      citizen_inputs: payload.citizen_inputs ?? null,
      documents: payload.documents ?? null,
      status: 'sent',
    })
    .select()
    .single()

  return { data, error }
}

