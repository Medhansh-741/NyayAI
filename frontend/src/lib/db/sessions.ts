import { supabase } from '@/lib/supabase/client'

export async function setActiveCaseForUser(userId: string, caseId: string | null) {
  const { data, error } = await supabase
    .from('user_sessions')
    .upsert({ user_id: userId, active_case_id: caseId, last_activity: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()

  return { data, error }
}

export async function getActiveCaseForUser(userId: string) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('active_case_id')
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

