'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { mapLawyerToCard, type LawyerCard } from '@/lib/utils/lawyer'

interface LawyerFilters {
    domain?: string
    state?: string
    district?: string
    budget_max?: number
    min_rating?: number
    verified_only?: boolean
}

export function useLawyers(filters: LawyerFilters = {}) {
    const [lawyers, setLawyers] = useState<LawyerCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetch() {
            setLoading(true)
            setError(null)

            let query = supabase
                .from('lawyer_profiles')
                .select('*')
                .eq('is_active', true)
                .eq('is_available', true)
                .gte('completeness_score', 60)
                .order('avg_rating', { ascending: false })

            if (filters.domain) {
                query = query.contains('specialisations', [filters.domain])
            }
            if (filters.state) {
                query = query.eq('practice_state', filters.state)
            }
            if (filters.district) {
                query = query.eq('practice_district', filters.district)
            }
            if (filters.budget_max) {
                query = query.lte('fee_min', filters.budget_max)
            }
            if (filters.min_rating) {
                query = query.gte('avg_rating', filters.min_rating)
            }
            if (filters.verified_only) {
                query = query.eq('verification_status', 'verified')
            }

            const { data, error: fetchError } = await query

            if (fetchError) {
                setError(fetchError.message)
            } else {
                setLawyers((data ?? []).map(mapLawyerToCard))
            }

            setLoading(false)
        }

        fetch()
    }, [
        filters.domain,
        filters.state,
        filters.district,
        filters.budget_max,
        filters.min_rating,
        filters.verified_only
    ])

    return { lawyers, loading, error }
}