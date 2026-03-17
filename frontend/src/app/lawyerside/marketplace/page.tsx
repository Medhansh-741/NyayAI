'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import { LiquidSlider } from '../../../../components/LiquidSlider';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { Menu, Home, Compass, Store, Gavel } from 'lucide-react';
import { acceptAvailableCase } from '@/lib/db/pipeline';
import * as Dialog from '@radix-ui/react-dialog';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type LawyerProfile = Database['public']['Tables']['lawyer_profiles']['Row'];
type PipelineRow = Database['public']['Tables']['case_pipeline']['Row'];
// NOTE: `brief_dispatches` is a new table; Supabase types may be stale locally.
// We keep it typed narrowly here to avoid breaking the build.
type BriefDispatchRow = {
  id: string
  case_id: string
  citizen_id: string
  lawyer_id: string
  intro_message: string
  ai_brief: unknown | null
  citizen_inputs: unknown | null
  documents: unknown | null
  status: string
  created_at: string | null
}

type BriefDispatchClient = {
  from: (table: 'brief_dispatches') => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        in: (column: string, value: string[]) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: BriefDispatchRow[] | null; error: { message: string } | null }>
        }
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: BriefDispatchRow[] | null; error: { message: string } | null }>
        }
      }
    }
    update: (values: { status: string }) => {
      eq: (column: string, value: string) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  }
}

type CasePreview = Pick<
  CaseRow,
  | 'id'
  | 'title'
  | 'domain'
  | 'status'
  | 'state'
  | 'district'
  | 'incident_description'
  | 'incident_date'
  | 'budget_min'
  | 'budget_max'
  | 'confidence_score'
  | 'created_at'
>

type LawyerProfilePreview = Pick<LawyerProfile, 'id' | 'full_name' | 'specialisations'>

interface OfferedCase {
  pipeline: PipelineRow;
  caseData: CasePreview;
}

interface IncomingDispatch {
  dispatch: BriefDispatchRow;
  caseData: CasePreview;
  offerStage: PipelineRow['stage'] | null;
  offerSentAt: string | null;
}

function formatStage(stage: string | null): string {
  if (!stage) return 'Pending'
  const labels: Record<string, string> = {
    pending: 'Pending',
    offered: 'Offered',
    accepted: 'Accepted',
    active: 'In Progress',
    completed: 'Completed',
    withdrawn: 'Withdrawn',
  }
  return labels[stage] ?? stage.replace(/_/g, ' ')
}

function stageColor(stage: string | null): string {
  switch (stage) {
    case 'accepted':    return 'bg-emerald-500/20 text-emerald-700'
    case 'active':      return 'bg-blue-500/20 text-blue-700'
    case 'completed':   return 'bg-purple-500/20 text-purple-700'
    case 'withdrawn':   return 'bg-gray-500/20 text-gray-600'
    default:            return 'bg-amber-500/20 text-amber-700'
  }
}

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'my-cases', icon: Gavel, label: 'My Cases', href: '/lawyerside/my-cases' },
];

const DOMAIN_LABELS: Record<string, string> = {
  consumer:              'Consumer Disputes',
  tenant:                'Tenant / Rent',
  labour:                'Labour & Employment',
  criminal:              'Criminal Law',
  cyber:                 'Cyber Crime',
  property:              'Property Law',
  family:                'Family Law',
  rti:                   'RTI',
  corruption:            'Anti-Corruption',
  civil:                 'Civil Law',
  other:                 'General Practice',
  tax:                   'Tax Law',
  corporate:             'Corporate / Business',
  intellectual_property: 'Intellectual Property',
  constitutional:        'Constitutional / PIL',
  banking_finance:       'Banking & Finance',
  insurance:             'Insurance',
  matrimonial:           'Matrimonial',
  immigration:           'Immigration',
  environmental:         'Environmental Law',
  medical_negligence:    'Medical Negligence',
  motor_accident:        'Motor Accident Claims',
  cheque_bounce:         'Cheque Bounce (NI Act)',
  debt_recovery:         'Debt Recovery',
  arbitration:           'Arbitration & ADR',
  service_matters:       'Service Matters',
  land_acquisition:      'Land Acquisition',
  wills_succession:      'Wills & Succession',
  domestic_violence:     'Domestic Violence',
  pocso:                 'POCSO',
  sc_st_atrocities:      'SC/ST Atrocities Act',
  divorce:               'Divorce',
}

function formatDomain(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain.replace(/_/g, ' ')
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'Budget not specified'
  if (min && !max)  return `From ₹${min.toLocaleString('en-IN')}`
  if (!min && max)  return `Up to ₹${max.toLocaleString('en-IN')}`
  return `₹${min!.toLocaleString('en-IN')} – ₹${max!.toLocaleString('en-IN')}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30)  return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const allBudgetLabels = [
  '₹0','₹5k','₹10k','₹20k','₹30k','₹50k','₹75k','₹1L','₹1.5L','₹2L','₹3L','₹5L+'
]

function parseBudget(str: string): number {
  if (!str || str === '₹0') return 0
  if (str === '₹5L+') return 999999999
  if (str.includes('k'))  return parseInt(str.replace('₹','').replace('k','')) * 1000
  if (str.includes('L'))  return parseFloat(str.replace('₹','').replace('L','')) * 100000
  return 0
}

export default function LawyerCaseMarketplace() {
  const router = useRouter()
  const briefDispatchClient = supabase as unknown as BriefDispatchClient
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfilePreview | null>(null)
  const [allCases, setAllCases]             = useState<CasePreview[]>([])
  const [incomingDispatches, setIncomingDispatches] = useState<IncomingDispatch[]>([])
  const [isLoading, setIsLoading]           = useState(true)
  const [offeredLoading, setOfferedLoading] = useState(true)
  const [dbError, setDbError]               = useState<string | null>(null)
  const [offeredError, setOfferedError]     = useState<string | null>(null)
  const [hoveredCard, setHoveredCard]       = useState<string | null>(null)
  const [activeTab, setActiveTab]           = useState<'left' | 'right'>('left')
  const [acceptingCaseId, setAcceptingCaseId] = useState<string | null>(null)
  const [now, setNow] = useState<number>(0)
  const [selectedAvailable, setSelectedAvailable] = useState<CasePreview | null>(null)
  const [selectedDispatch, setSelectedDispatch] = useState<IncomingDispatch | null>(null)
  const [offerAmountInput, setOfferAmountInput] = useState<string>('25000')
  const [offerMessageInput, setOfferMessageInput] = useState<string>('Scope, timeline, engagement type, and next steps...')
  const [sendingOffer, setSendingOffer] = useState(false)
  const [currentLawyerId, setCurrentLawyerId] = useState<string | null>(null)
  const [hiddenAvailableCaseIds, setHiddenAvailableCaseIds] = useState<Set<string>>(new Set())
  const [hiddenIncomingDispatchIds, setHiddenIncomingDispatchIds] = useState<Set<string>>(new Set())
  const [dismissingCaseId, setDismissingCaseId] = useState<string | null>(null)

  const handleProfileClick = () => {
    router.push('/lawyerside/profile')
  }

  const getHiddenAvailableKey = (lawyerId: string) => `hidden_available_cases:${lawyerId}`
  const getHiddenIncomingKey = (lawyerId: string) => `hidden_incoming_dispatches:${lawyerId}`

  const loadHiddenState = useCallback((lawyerId: string) => {
    try {
      const availableRaw = localStorage.getItem(getHiddenAvailableKey(lawyerId))
      const incomingRaw = localStorage.getItem(getHiddenIncomingKey(lawyerId))
      const available = availableRaw ? (JSON.parse(availableRaw) as string[]) : []
      const incoming = incomingRaw ? (JSON.parse(incomingRaw) as string[]) : []
      setHiddenAvailableCaseIds(new Set(available))
      setHiddenIncomingDispatchIds(new Set(incoming))
    } catch {
      setHiddenAvailableCaseIds(new Set())
      setHiddenIncomingDispatchIds(new Set())
    }
  }, [])

  const persistHiddenAvailable = useCallback((lawyerId: string, next: Set<string>) => {
    localStorage.setItem(getHiddenAvailableKey(lawyerId), JSON.stringify(Array.from(next)))
  }, [])

  const persistHiddenIncoming = useCallback((lawyerId: string, next: Set<string>) => {
    localStorage.setItem(getHiddenIncomingKey(lawyerId), JSON.stringify(Array.from(next)))
  }, [])

  const handleDismissAvailableCase = useCallback((caseId: string) => {
    if (!currentLawyerId) return
    setHiddenAvailableCaseIds((prev) => {
      const next = new Set(prev)
      next.add(caseId)
      persistHiddenAvailable(currentLawyerId, next)
      return next
    })
  }, [currentLawyerId, persistHiddenAvailable])

  const handleDismissIncomingRequest = useCallback(async (incoming: IncomingDispatch) => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setOfferedError('Not authenticated. Please log in.')
      return
    }

    setDismissingCaseId(incoming.dispatch.id)

    // Archive incoming request for lawyer view
    const { error: archiveErr } = await briefDispatchClient
      .from('brief_dispatches')
      .update({ status: 'archived' })
      .eq('id', incoming.dispatch.id)

    if (archiveErr) {
      setOfferedError(archiveErr.message)
      setDismissingCaseId(null)
      return
    }

    // If an offer was already sent, withdraw it so this request is fully removed from lawyer side.
    if (incoming.offerStage === 'offered') {
      await supabase
        .from('case_pipeline')
        .update({ stage: 'withdrawn' })
        .eq('case_id', incoming.caseData.id)
        .eq('lawyer_id', authData.user.id)
        .eq('stage', 'offered')
    }

    if (currentLawyerId) {
      setHiddenIncomingDispatchIds((prev) => {
        const next = new Set(prev)
        next.add(incoming.dispatch.id)
        persistHiddenIncoming(currentLawyerId, next)
        return next
      })
    }

    setIncomingDispatches((prev) => prev.filter((d) => d.dispatch.id !== incoming.dispatch.id))
    if (selectedDispatch?.dispatch.id === incoming.dispatch.id) {
      setSelectedDispatch(null)
    }
    setDismissingCaseId(null)
  }, [briefDispatchClient, currentLawyerId, persistHiddenIncoming, selectedDispatch])

  const handleSendOfferFromDispatch = useCallback(async (incoming: IncomingDispatch, offerAmountRaw: string, offerMessage: string) => {
    const offerAmount = Number(offerAmountRaw)
    if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
      setOfferedError('Invalid offer amount.')
      return
    }
    if (!offerMessage || offerMessage.trim().length < 10) {
      setOfferedError('Please add a clear offer message (at least 10 characters).')
      return
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setOfferedError('Not authenticated. Please log in.')
      return
    }

    setSendingOffer(true)

    const { data: existingRows, error: existingErr } = await supabase
      .from('case_pipeline')
      .select('id, stage')
      .eq('case_id', incoming.caseData.id)
      .eq('lawyer_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingErr) {
      setOfferedError(existingErr.message)
      setSendingOffer(false)
      return
    }

    const existing = existingRows?.[0] ?? null

    if (existing?.stage && ['accepted', 'active', 'completed'].includes(existing.stage)) {
      setOfferedError('This case is already accepted and moved to My Cases.')
      setSendingOffer(false)
      return
    }

    const offerPayload = {
      offer_amount: offerAmount,
      offer_message: offerMessage.trim(),
      offer_note: incoming.dispatch.intro_message,
      offer_sent_at: new Date().toISOString(),
    }

    let offerErr: { message: string } | null = null

    if (existing?.stage === 'offered') {
      const { error } = await supabase
        .from('case_pipeline')
        .update(offerPayload)
        .eq('id', existing.id)
      offerErr = error
    } else {
      const { error } = await supabase
        .from('case_pipeline')
        .insert({
          case_id: incoming.caseData.id,
          lawyer_id: authData.user.id,
          stage: 'offered',
          ...offerPayload,
        })
      offerErr = error
    }

    if (offerErr) {
      setOfferedError(offerErr.message)
      setSendingOffer(false)
      return
    }

    await briefDispatchClient
      .from('brief_dispatches')
      .update({ status: 'offered' })
      .eq('id', incoming.dispatch.id)

    setIncomingDispatches((prev) =>
      prev.map((d) =>
        d.dispatch.id === incoming.dispatch.id
          ? {
              ...d,
              dispatch: { ...d.dispatch, status: 'offered' },
              offerStage: 'offered',
              offerSentAt: new Date().toISOString(),
            }
          : d
      )
    )
    setSelectedDispatch(null)
    setSendingOffer(false)
  }, [])

  const handleAcceptAvailable = useCallback(async (caseId: string) => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setDbError('Not authenticated. Please log in.')
      return
    }

    setAcceptingCaseId(caseId)
    const { error } = await acceptAvailableCase(caseId, authData.user.id, 'Lawyer accepted an available case.')
    setAcceptingCaseId(null)
    if (error) {
      setDbError(error.message)
      return
    }

    // Instant UI feedback: remove from Available list
    setAllCases((prev) => prev.filter((c) => c.id !== caseId))
    setSelectedAvailable(null)
    router.push('/lawyerside/my-cases')
  }, [router])

  const statusPillClass = dbError
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/20'
    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/20'

  const statusDotClass = dbError
    ? 'bg-red-500 dark:bg-red-400'
    : 'bg-emerald-500 dark:bg-green-400 animate-pulse'

  // ── Budget wheel ───────────────────────────────────────
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState<number>(allBudgetLabels.length - 1)

  // ── Domain dropdown ────────────────────────────────────
  const [isDomainOpen, setIsDomainOpen]       = useState(false)
  const [selectedDomain, setSelectedDomain]   = useState('Legal Domain')
  const dropdownRef                           = useRef<HTMLDivElement>(null)
  const dropdownContentRef                    = useRef<HTMLDivElement>(null)

  // ── Recency dropdown ───────────────────────────────────
  const [isRecencyOpen, setIsRecencyOpen]       = useState(false)
  const [selectedRecency, setSelectedRecency]   = useState('Any Time')
  const recDropdownRef                          = useRef<HTMLDivElement>(null)
  const recDropdownContentRef                   = useRef<HTMLDivElement>(null)

  const recencyOptions = useMemo(() => [
    { label: 'Last 24 hours',  ms: 24 * 60 * 60 * 1000 },
    { label: 'Last 7 days',    ms: 7 * 24 * 60 * 60 * 1000 },
    { label: 'Last 30 days',   ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Last 90 days',   ms: 90 * 24 * 60 * 60 * 1000 },
  ], [])

  // ── Fetch lawyer profile + unassigned cases ────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setOfferedLoading(true)
    setDbError(null)
    setOfferedError(null)

    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setDbError('Not authenticated. Please log in.')
        setOfferedError('Not authenticated. Please log in.')
        setIsLoading(false)
        setOfferedLoading(false)
        return
      }

      setCurrentLawyerId(user.id)
      loadHiddenState(user.id)

      // 2. Get lawyer profile for specialisations
      const { data: profile, error: profileError } = await supabase
        .from('lawyer_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setDbError('Lawyer profile not found.')
        setOfferedError('Lawyer profile not found.')
        setIsLoading(false)
        setOfferedLoading(false)
        return
      }
      setLawyerProfile(profile)

      const specialisations = profile.specialisations ?? []

      // 3. Get all assigned case IDs from case_pipeline
      const { data: pipelineData } = await supabase
        .from('case_pipeline')
        .select('case_id')

      const assignedCaseIds = new Set((pipelineData ?? []).map(p => p.case_id))

      // 4. Fetch cases that are seeking a lawyer (Available tab)
      let query = supabase
        .from('cases')
        // keep citizen anonymous for lawyers: do not fetch citizen_id
        .select('id, title, domain, status, state, district, incident_description, incident_date, budget_min, budget_max, confidence_score, created_at')
        .eq('is_seeking_lawyer', true)
        .eq('status', 'seeking_lawyer')
        .order('created_at', { ascending: false })

      if (specialisations.length > 0) {
        query = query.in('domain', specialisations)
      }

      const { data: casesData, error: casesError } = await query

      if (casesError) {
        setDbError(casesError.message)
      } else {
        const unassigned = (casesData ?? []).filter(c => !assignedCaseIds.has(c.id))
        setAllCases(unassigned)
      }
      setIsLoading(false)

      // 5. Fetch incoming brief dispatches (Inbox tab)
      const { data: dispatchRows, error: dispatchErr } = await briefDispatchClient
        .from('brief_dispatches')
        .select('id, case_id, citizen_id, lawyer_id, intro_message, ai_brief, citizen_inputs, documents, status, created_at')
        .eq('lawyer_id', user.id)
        .in('status', ['sent', 'offered'])
        .order('created_at', { ascending: false })

      if (dispatchErr) {
        setOfferedError(dispatchErr.message)
        setOfferedLoading(false)
        return
      }

      if (!dispatchRows || dispatchRows.length === 0) {
        setIncomingDispatches([])
        setOfferedLoading(false)
        return
      }

      const caseIds = (dispatchRows as BriefDispatchRow[]).map((d) => d.case_id)
      const { data: caseRows, error: caseErr } = await supabase
        .from('cases')
        .select('id, title, domain, status, state, district, incident_description, incident_date, budget_min, budget_max, confidence_score, created_at')
        .in('id', caseIds)

      if (caseErr) {
        setOfferedError(caseErr.message)
        setOfferedLoading(false)
        return
      }

      const caseMap = new Map((caseRows ?? []).map((c) => [c.id, c]))

      const { data: pipelineForIncoming } = await supabase
        .from('case_pipeline')
        .select('case_id, stage, offer_sent_at, created_at')
        .eq('lawyer_id', user.id)
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })

      const latestPipelineByCase = new Map<string, { stage: PipelineRow['stage'] | null; offer_sent_at: string | null }>()
      ;(pipelineForIncoming ?? []).forEach((row) => {
        if (!latestPipelineByCase.has(row.case_id)) {
          latestPipelineByCase.set(row.case_id, { stage: row.stage, offer_sent_at: row.offer_sent_at })
        }
      })

      const merged: IncomingDispatch[] = (dispatchRows as BriefDispatchRow[])
        .filter((d) => caseMap.has(d.case_id))
        .map((d) => {
          const latest = latestPipelineByCase.get(d.case_id)
          return {
            dispatch: d,
            caseData: caseMap.get(d.case_id)!,
            offerStage: latest?.stage ?? null,
            offerSentAt: latest?.offer_sent_at ?? null,
          }
        })
        .filter((entry) => !['accepted', 'active', 'completed'].includes(entry.offerStage ?? ''))

      setIncomingDispatches(merged)
    } catch (err) {
      console.error('Error fetching data:', err)
      setDbError('Unexpected error loading cases.')
      setOfferedError('Unexpected error loading cases.')
    }

    setIsLoading(false)
    setOfferedLoading(false)
  }, [loadHiddenState])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('lawyer-case-marketplace-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        () => { fetchData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'case_pipeline' },
        () => { fetchData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brief_dispatches' },
        () => { fetchData() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [fetchData])

  useEffect(() => {
    // snapshot time for render-purity lint and stable filtering
    setNow(Date.now())
  }, [activeTab, selectedRecency])

  // ── Derived filter options (uses active list) ─────────
  const activeCaseList = activeTab === 'left'
    ? allCases
    : incomingDispatches.map((d) => d.caseData)

  const domainOptions = useMemo(() => {
    const domains = new Set<string>()
    activeCaseList.forEach(c => domains.add(c.domain))
    return Array.from(domains).sort()
  }, [activeCaseList])

  // ── Filtered results (Available Cases) ─────────────────
  const filteredCases = useMemo(() => {
    let result = [...allCases]

    result = result.filter((c) => !hiddenAvailableCaseIds.has(c.id))

    if (selectedDomain !== 'Legal Domain') {
      result = result.filter(c => c.domain === selectedDomain)
    }

    if (selectedRecency !== 'Any Time') {
      const opt = recencyOptions.find(o => o.label === selectedRecency)
      if (opt) {
        const cutoff = now - opt.ms
        result = result.filter(c => c.created_at && new Date(c.created_at).getTime() >= cutoff)
      }
    }

    const idx   = Math.min(selectedBudgetIndex, allBudgetLabels.length - 1)
    const maxB  = parseBudget(allBudgetLabels[idx] ?? '₹5L+')
    result = result.filter(c => !c.budget_min || c.budget_min <= maxB)

    return result
  }, [allCases, selectedDomain, selectedRecency, selectedBudgetIndex, recencyOptions, hiddenAvailableCaseIds])

  // ── Filtered results (Incoming Requests) ───────────────
  const filteredDispatches = useMemo(() => {
    let result = [...incomingDispatches]

    result = result.filter((o) => !hiddenIncomingDispatchIds.has(o.dispatch.id))

    if (selectedDomain !== 'Legal Domain') {
      result = result.filter(o => o.caseData.domain === selectedDomain)
    }

    if (selectedRecency !== 'Any Time') {
      const opt = recencyOptions.find(o => o.label === selectedRecency)
      if (opt) {
        const cutoff = now - opt.ms
        result = result.filter(o => o.dispatch.created_at && new Date(o.dispatch.created_at).getTime() >= cutoff)
      }
    }

    const idx   = Math.min(selectedBudgetIndex, allBudgetLabels.length - 1)
    const maxB  = parseBudget(allBudgetLabels[idx] ?? '₹5L+')
    result = result.filter(o => !o.caseData.budget_min || o.caseData.budget_min <= maxB)

    return result.sort((a, b) => {
      const aTs = a.dispatch.created_at ? new Date(a.dispatch.created_at).getTime() : 0
      const bTs = b.dispatch.created_at ? new Date(b.dispatch.created_at).getTime() : 0
      return bTs - aTs
    })
  }, [incomingDispatches, selectedDomain, selectedRecency, selectedBudgetIndex, recencyOptions, now, hiddenIncomingDispatchIds])

  // ── Click outside ──────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDomainOpen(false)
      }
      if (recDropdownRef.current && !recDropdownRef.current.contains(e.target as Node)) {
        setIsRecencyOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── GSAP dropdowns ─────────────────────────────────────
  useEffect(() => {
    if (!dropdownContentRef.current) return
    if (isDomainOpen) {
      gsap.fromTo(dropdownContentRef.current,
        { opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power2.out', display: 'block' }
      )
    } else {
      gsap.to(dropdownContentRef.current, {
        opacity: 0, y: -10, scaleY: 0.9, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          if (dropdownContentRef.current) dropdownContentRef.current.style.display = 'none'
        }
      })
    }
  }, [isDomainOpen])

  useEffect(() => {
    if (!recDropdownContentRef.current) return
    if (isRecencyOpen) {
      gsap.fromTo(recDropdownContentRef.current,
        { opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power2.out', display: 'block' }
      )
    } else {
      gsap.to(recDropdownContentRef.current, {
        opacity: 0, y: -10, scaleY: 0.9, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          if (recDropdownContentRef.current) recDropdownContentRef.current.style.display = 'none'
        }
      })
    }
  }, [isRecencyOpen])

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f]">
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>

      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-10 text-gray-900 dark:text-white font-serif">

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2 font-serif">
              Case Marketplace
            </h1>
            <p className="text-gray-600 dark:text-white/70 text-[15px] font-sans">
              Browse unassigned cases matching your specialisations and send offers to represent clients.
            </p>
            {!(activeTab === 'left' ? isLoading : offeredLoading) && (
              <div className={`mt-3 inline-flex items-center gap-2 text-xs font-sans px-3 py-1 rounded-full ${activeTab === 'left' ? statusPillClass : (offeredError ? statusPillClass : statusPillClass)}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'left' ? statusDotClass : (offeredError ? 'bg-red-500 dark:bg-red-400' : statusDotClass)}`} />
              {activeTab === 'left'
                ? (dbError ? `Error: ${dbError}` : `${filteredCases.length} of ${allCases.length} cases shown`)
                : (offeredError ? `Error: ${offeredError}` : `${filteredDispatches.length} of ${incomingDispatches.length} requests shown`)
              }
              </div>
            )}
            {lawyerProfile && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(lawyerProfile.specialisations ?? []).map(spec => (
                  <span key={spec} className="px-2.5 py-0.5 bg-[#997953]/10 dark:bg-[#cdaa80]/15 rounded-full text-[11px] font-sans text-[#997953] dark:text-[#cdaa80] font-medium">
                    {formatDomain(spec)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Repositioned & Resized Slider */}
          <div className="shrink-0 flex items-center justify-end transform scale-[0.7] origin-top-right md:pt-1">
            <LiquidSlider
              leftLabel="Available"
              rightLabel="Incoming"
              value={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>


        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 font-sans w-full relative z-40">

          {/* Domain Filter */}
          <div className="relative z-[80] shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDomainOpen(v => !v)}
              className={`flex items-center gap-3 bg-white dark:bg-[#0f1e3f] border border-[#d8c1a1] dark:border-[#cdaa80]/50 text-[#443831] dark:text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#997953]/20 dark:focus:ring-[#cdaa80]/30 outline-none shadow-sm w-56 ${isDomainOpen ? 'bg-[#f7efe5] ring-1 ring-[#997953]/30 dark:bg-[#213a56] dark:ring-[#cdaa80]/50' : 'hover:bg-[#f9f4ec] dark:hover:bg-[#213a56]'}`}
            >
              <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="flex-1 text-left text-sm truncate">{selectedDomain}</span>
              <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isDomainOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              ref={dropdownContentRef}
              className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0f1e3f] border border-[#e3d4bf] dark:border-[#cdaa80]/30 rounded-lg shadow-[0_18px_45px_rgba(68,56,49,0.14)] dark:shadow-2xl overflow-hidden z-[90]"
              style={{ display: 'none' }}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                <button
                  onClick={() => { setSelectedDomain('Legal Domain'); setIsDomainOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedDomain === 'Legal Domain' ? 'bg-[#f6ede1] text-[#997953] font-medium dark:bg-[#cdaa80]/20 dark:text-[#cdaa80]' : 'text-[#5b4b3d] hover:bg-[#f8f1e7] hover:text-[#443831] dark:text-white/80 dark:hover:bg-[#213a56] dark:hover:text-[#cdaa80]'}`}
                >
                  All Domains
                </button>
                {domainOptions.map(type => (
                  <button
                    key={type}
                    onClick={() => { setSelectedDomain(type); setIsDomainOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedDomain === type ? 'bg-[#f6ede1] text-[#997953] font-medium dark:bg-[#cdaa80]/20 dark:text-[#cdaa80]' : 'text-[#5b4b3d] hover:bg-[#f8f1e7] hover:text-[#443831] dark:text-white/80 dark:hover:bg-[#213a56] dark:hover:text-[#cdaa80]'}`}
                  >
                    {formatDomain(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Wheel */}
          <div className="relative w-full md:w-[420px] h-16 bg-[#f5eee2] dark:bg-[#0a152e] shrink-0 flex items-center justify-center overflow-hidden rounded-full border border-[#dcc7aa] dark:border-[#cdaa80]/20 shadow-[inset_0_2px_8px_rgba(153,121,83,0.12),_0_10px_24px_rgba(68,56,49,0.08)] dark:shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),_0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute left-0 w-24 h-full bg-gradient-to-r from-[#f5eee2] via-[#f5eee2]/80 to-transparent dark:from-[#0a152e] dark:via-[#0a152e]/80 z-20 pointer-events-none rounded-l-full" />
            <div className="absolute right-0 w-24 h-full bg-gradient-to-l from-[#f5eee2] via-[#f5eee2]/80 to-transparent dark:from-[#0a152e] dark:via-[#0a152e]/80 z-20 pointer-events-none rounded-r-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[46px] bg-white/90 dark:bg-[#cdaa80]/15 border border-[#c7ab88] dark:border-[#cdaa80]/70 rounded-full z-10 pointer-events-none shadow-[0_0_18px_rgba(153,121,83,0.16)] dark:shadow-[0_0_20px_rgba(205,170,128,0.3)]" />
            <div
              className="absolute top-1/2 left-1/2 flex items-center transition-transform duration-500 ease-out z-10"
              style={{ transform: `translate(calc(-${selectedBudgetIndex * 84 + 42}px), -50%)` }}
            >
              {allBudgetLabels.map((price, idx) => {
                const dist       = Math.abs(idx - selectedBudgetIndex)
                const isSelected = dist === 0
                return (
                  <div
                    key={price}
                    onClick={() => setSelectedBudgetIndex(idx)}
                    className={`w-[84px] shrink-0 text-center cursor-pointer transition-all duration-300 font-serif tracking-wide text-[16px] ${isSelected ? 'text-[#997953] drop-shadow-[0_0_10px_rgba(153,121,83,0.28)] dark:text-[#cdaa80] dark:drop-shadow-[0_0_12px_rgba(205,170,128,1)]' : 'text-[#7b6958]/60 hover:text-[#443831] dark:text-[#cdaa80]/50 dark:hover:text-[#cdaa80]/80'}`}
                    style={{
                      transform: `scale(${isSelected ? 1.05 : Math.max(0.7, 1 - dist * 0.15)})`,
                      opacity:    isSelected ? 1 : Math.max(0.15, 1 - dist * 0.25),
                    }}
                  >
                    {price}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recency Filter */}
          <div className="relative z-[60] shrink-0" ref={recDropdownRef}>
            <button
              onClick={() => setIsRecencyOpen(v => !v)}
              className={`flex items-center gap-3 bg-white dark:bg-[#0f1e3f] border border-[#d8c1a1] dark:border-[#cdaa80]/50 text-[#443831] dark:text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#997953]/20 dark:focus:ring-[#cdaa80]/30 outline-none shadow-sm w-56 ${isRecencyOpen ? 'bg-[#f7efe5] ring-1 ring-[#997953]/30 dark:bg-[#213a56] dark:ring-[#cdaa80]/50' : 'hover:bg-[#f9f4ec] dark:hover:bg-[#213a56]'}`}
            >
              <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1 text-left text-sm truncate">{selectedRecency}</span>
              <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isRecencyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              ref={recDropdownContentRef}
              className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0f1e3f] border border-[#e3d4bf] dark:border-[#cdaa80]/30 rounded-lg shadow-[0_18px_45px_rgba(68,56,49,0.14)] dark:shadow-2xl overflow-hidden z-[70]"
              style={{ display: 'none' }}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                <button
                  onClick={() => { setSelectedRecency('Any Time'); setIsRecencyOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedRecency === 'Any Time' ? 'bg-[#f6ede1] text-[#997953] font-medium dark:bg-[#cdaa80]/20 dark:text-[#cdaa80]' : 'text-[#5b4b3d] hover:bg-[#f8f1e7] hover:text-[#443831] dark:text-white/80 dark:hover:bg-[#213a56] dark:hover:text-[#cdaa80]'}`}
                >
                  Any Time
                </button>
                {recencyOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setSelectedRecency(opt.label); setIsRecencyOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedRecency === opt.label ? 'bg-[#f6ede1] text-[#997953] font-medium dark:bg-[#cdaa80]/20 dark:text-[#cdaa80]' : 'text-[#5b4b3d] hover:bg-[#f8f1e7] hover:text-[#443831] dark:text-white/80 dark:hover:bg-[#213a56] dark:hover:text-[#cdaa80]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* AVAILABLE CASES TAB                               */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === 'left' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#997953] dark:border-[#cdaa80]" />
              </div>
            ) : dbError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-400/30 rounded-xl">
                <p className="text-red-400 font-sans text-sm">Failed to load cases</p>
                <p className="text-red-400/60 font-mono text-xs mt-1">{dbError}</p>
                <button
                  onClick={fetchData}
                  className="mt-4 px-4 py-2 bg-[#997953]/10 text-[#997953] border border-[#997953]/20 rounded-lg text-sm hover:bg-[#997953]/15 dark:bg-[#cdaa80]/20 dark:text-[#cdaa80] dark:border-transparent dark:hover:bg-[#cdaa80]/25 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#d8c1a1] dark:border-[#cdaa80]/30 rounded-xl bg-white/80 dark:bg-[#0a152e]/50 shadow-sm">
                <svg className="w-12 h-12 text-[#997953]/40 dark:text-[#cdaa80]/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-serif text-[#997953] dark:text-[#cdaa80] mb-2">No cases found</h3>
                <p className="text-gray-600 dark:text-white/60 font-sans max-w-md">
                  There are no unassigned cases matching your specialisations right now. Check back later or adjust your filters.
                </p>
              </div>
            ) : (
              filteredCases.map(caseItem => {
                const budget = formatBudget(caseItem.budget_min, caseItem.budget_max)
                const posted = timeAgo(caseItem.created_at)
                const confidence = caseItem.confidence_score
                  ? `${(caseItem.confidence_score * 100).toFixed(0)}%`
                  : null

                return (
                  <div
                    key={caseItem.id}
                    onMouseEnter={() => setHoveredCard(caseItem.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`block bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-6 md:p-8 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden shadow-lg border border-gray-100 dark:border-transparent ${hoveredCard === caseItem.id ? 'transform -translate-y-1 shadow-2xl brightness-105' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismissAvailableCase(caseItem.id)
                      }}
                      className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full border border-[#0f1e3f]/20 bg-white/90 text-[#0f1e3f]/70 hover:bg-[#0f1e3f] hover:text-[#cdaa80] transition-colors"
                      title="Remove from marketplace"
                    >
                      ×
                    </button>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f1e3f 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                      {/* Left */}
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <span className="inline-block px-1.5 py-0.5 bg-[#0f1e3f]/10 rounded text-[10px] font-bold tracking-wider font-sans text-[#0f1e3f]/70 uppercase">
                            {formatDomain(caseItem.domain)}
                          </span>
                          <div className="md:hidden text-right font-sans">
                            <div className="text-lg font-bold font-serif">{budget}</div>
                          </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-medium tracking-tight">
                          <span className="font-semibold">{caseItem.title ?? 'Untitled Case'}</span>
                        </h2>
                        <p className="text-[#0f1e3f]/80 text-[14px] leading-relaxed font-sans max-w-4xl pr-4 line-clamp-2">
                          {caseItem.incident_description ?? 'No description provided.'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {caseItem.state && (
                            <span className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60">
                              📍 {caseItem.district ? `${caseItem.district}, ` : ''}{caseItem.state}
                            </span>
                          )}
                          {caseItem.incident_date && (
                            <span className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60">
                              📅 Incident: {new Date(caseItem.incident_date).toLocaleDateString('en-IN')}
                            </span>
                          )}
                          {confidence && (
                            <span className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60">
                              🎯 Confidence: {confidence}
                            </span>
                          )}
                        </div>
                        <div className="pt-4 flex items-center justify-between font-sans flex-wrap gap-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-sm text-[#0f1e3f]/70">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Posted {posted}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium text-[#0f1e3f]/90">
                              <div className="bg-emerald-500/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-emerald-700">●</div>
                              Seeking Lawyer
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedAvailable(caseItem) }}
                              className={`md:hidden px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 text-center mt-2 w-full max-w-[160px] ${hoveredCard === caseItem.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}
                            >
                              View case
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void handleAcceptAvailable(caseItem.id) }}
                              disabled={acceptingCaseId === caseItem.id}
                              className={`md:hidden px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 text-center mt-2 w-full max-w-[180px] ${hoveredCard === caseItem.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'} disabled:opacity-60`}
                            >
                              {acceptingCaseId === caseItem.id ? 'Accepting…' : 'Accept offer'}
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Right */}
                      <div className="hidden md:flex flex-col items-end justify-between shrink-0 pl-6 border-l border-[#0f1e3f]/10">
                        <div className="text-right font-sans">
                          <div className="text-[17px] font-bold font-serif mb-1">{budget}</div>
                          <div className="text-[11px] text-[#0f1e3f]/50 whitespace-nowrap">Client Budget</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedAvailable(caseItem) }}
                            className={`px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 mt-4 text-center ${hoveredCard === caseItem.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}
                          >
                            View case
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void handleAcceptAvailable(caseItem.id) }}
                            disabled={acceptingCaseId === caseItem.id}
                            className={`px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 mt-4 text-center ${hoveredCard === caseItem.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'} disabled:opacity-60`}
                          >
                            {acceptingCaseId === caseItem.id ? 'Accepting…' : 'Accept offer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* OFFERED CASES TAB                                 */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === 'right' && (
          <div className="space-y-6">
            {offeredLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#997953] dark:border-[#cdaa80]" />
              </div>
            ) : offeredError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-400/30 rounded-xl">
                <p className="text-red-400 font-sans text-sm">Failed to load offered cases</p>
                <p className="text-red-400/60 font-mono text-xs mt-1">{offeredError}</p>
                <button
                  onClick={fetchData}
                  className="mt-4 px-4 py-2 bg-[#997953]/10 text-[#997953] border border-[#997953]/20 rounded-lg text-sm hover:bg-[#997953]/15 dark:bg-[#cdaa80]/20 dark:text-[#cdaa80] dark:border-transparent dark:hover:bg-[#cdaa80]/25 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredDispatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#d8c1a1] dark:border-[#cdaa80]/30 rounded-xl bg-white/80 dark:bg-[#0a152e]/50 shadow-sm">
                <svg className="w-12 h-12 text-[#997953]/40 dark:text-[#cdaa80]/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-serif text-[#997953] dark:text-[#cdaa80] mb-2">No incoming requests</h3>
                <p className="text-gray-600 dark:text-white/60 font-sans max-w-md">
                  No citizens have requested you yet. When they do, requests will appear here for you to accept.
                </p>
              </div>
            ) : (
              filteredDispatches.map(({ dispatch, caseData }) => {
                const budget = formatBudget(caseData.budget_min, caseData.budget_max)
                const offerDate = timeAgo(dispatch.created_at)
                const confidence = caseData.confidence_score
                  ? `${(caseData.confidence_score * 100).toFixed(0)}%`
                  : null
                const incoming = incomingDispatches.find((entry) => entry.dispatch.id === dispatch.id)
                const isOfferSent = incoming?.offerStage === 'offered'
                const offerWaitingText = incoming?.offerSentAt ? `Offer sent ${timeAgo(incoming.offerSentAt)} • Waiting for citizen acceptance` : 'Offer sent • Waiting for citizen acceptance'

                return (
                  <div
                    key={dispatch.id}
                    onMouseEnter={() => setHoveredCard(dispatch.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`block bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-6 md:p-8 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden shadow-lg border border-gray-100 dark:border-transparent ${hoveredCard === dispatch.id ? 'transform -translate-y-1 shadow-2xl brightness-105' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDismissIncomingRequest({ dispatch, caseData, offerStage: incoming?.offerStage ?? null, offerSentAt: incoming?.offerSentAt ?? null })
                      }}
                      disabled={dismissingCaseId === dispatch.id}
                      className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full border border-[#0f1e3f]/20 bg-white/90 text-[#0f1e3f]/70 hover:bg-[#0f1e3f] hover:text-[#cdaa80] transition-colors disabled:opacity-60"
                      title="Remove from incoming"
                    >
                      {dismissingCaseId === dispatch.id ? '…' : '×'}
                    </button>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f1e3f 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                      {/* Left */}
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-1.5 py-0.5 bg-[#0f1e3f]/10 rounded text-[10px] font-bold tracking-wider font-sans text-[#0f1e3f]/70 uppercase">
                              {formatDomain(caseData.domain)}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase bg-amber-500/20 text-amber-700">
                              {isOfferSent ? 'Offer Sent' : 'Incoming'}
                            </span>
                          </div>
                          <div className="md:hidden text-right font-sans">
                            <div className="text-lg font-bold font-serif">
                              {budget}
                            </div>
                          </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-medium tracking-tight">
                          <span className="font-semibold">{caseData.title ?? 'Untitled Case'}</span>
                        </h2>
                        <p className="text-[#0f1e3f]/80 text-[14px] leading-relaxed font-sans max-w-4xl pr-4 line-clamp-2">
                          {caseData.incident_description ?? 'No description provided.'}
                        </p>
                        {dispatch.intro_message && (
                          <div className="bg-[#0f1e3f]/5 rounded-lg px-3 py-2 text-[13px] font-sans text-[#0f1e3f]/70 italic">
                            &ldquo;{dispatch.intro_message}&rdquo;
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {caseData.state && (
                            <span className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60">
                              📍 {caseData.district ? `${caseData.district}, ` : ''}{caseData.state}
                            </span>
                          )}
                          {confidence && (
                            <span className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60">
                              🎯 Confidence: {confidence}
                            </span>
                          )}
                        </div>
                        <div className="pt-4 flex items-center justify-between font-sans flex-wrap gap-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-sm text-[#0f1e3f]/70">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {isOfferSent ? offerWaitingText : `Incoming ${offerDate}`}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedDispatch({ dispatch, caseData }) }}
                              className={`md:hidden px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 text-center mt-2 w-full max-w-[160px] ${hoveredCard === dispatch.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}
                            >
                              View case
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOfferAmountInput('25000')
                                setOfferMessageInput('Scope, timeline, engagement type, and next steps...')
                                setSelectedDispatch({ dispatch, caseData })
                              }}
                              disabled={isOfferSent}
                              className={`md:hidden px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 text-center mt-2 w-full max-w-[180px] ${hoveredCard === dispatch.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'} disabled:opacity-60`}
                            >
                              {isOfferSent ? 'Waiting acceptance' : 'Send offer'}
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Right */}
                      <div className="hidden md:flex flex-col items-end justify-between shrink-0 pl-6 border-l border-[#0f1e3f]/10">
                        <div className="text-right font-sans">
                          <div className="text-[17px] font-bold font-serif mb-1">
                            {budget}
                          </div>
                          <div className="text-[11px] text-[#0f1e3f]/50 whitespace-nowrap">
                            Client Budget
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedDispatch({ dispatch, caseData }) }}
                            className={`px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 mt-4 text-center ${hoveredCard === dispatch.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}
                          >
                            View case
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOfferAmountInput('25000')
                              setOfferMessageInput('Scope, timeline, engagement type, and next steps...')
                              setSelectedDispatch({ dispatch, caseData })
                            }}
                            disabled={isOfferSent}
                            className={`px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 mt-4 text-center ${hoveredCard === dispatch.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'} disabled:opacity-60`}
                          >
                            {isOfferSent ? 'Waiting acceptance' : 'Send offer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* View Case Modal (Available) */}
        <Dialog.Root open={!!selectedAvailable} onOpenChange={(open) => { if (!open) setSelectedAvailable(null) }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9998]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#0a152e] border border-[#e3d4bf] dark:border-[#cdaa80]/25 shadow-2xl p-5 md:p-6 z-[9999]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-lg md:text-xl font-serif text-[#997953] dark:text-[#cdaa80]">
                    {selectedAvailable?.title ?? 'Untitled Case'}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                    {selectedAvailable ? formatDomain(selectedAvailable.domain) : ''}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-lg px-3 py-1.5 text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12254a]">
                  Close
                </Dialog.Close>
              </div>

              {selectedAvailable && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-sans text-[#2f261f] dark:text-white/85 leading-relaxed">
                    {selectedAvailable.incident_description ?? 'No description provided.'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Budget</div>
                      <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                        {formatBudget(selectedAvailable.budget_min, selectedAvailable.budget_max)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Posted</div>
                      <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                        {formatDate(selectedAvailable.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedAvailable.state && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#997953]/10 text-[#5b4b3d] dark:bg-[#cdaa80]/10 dark:text-white/70">
                        {selectedAvailable.district ? `${selectedAvailable.district}, ` : ''}{selectedAvailable.state}
                      </span>
                    )}
                    {selectedAvailable.incident_date && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#997953]/10 text-[#5b4b3d] dark:bg-[#cdaa80]/10 dark:text-white/70">
                        Incident: {new Date(selectedAvailable.incident_date).toLocaleDateString('en-IN')}
                      </span>
                    )}
                    {selectedAvailable.confidence_score !== null && selectedAvailable.confidence_score !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#997953]/10 text-[#5b4b3d] dark:bg-[#cdaa80]/10 dark:text-white/70">
                        Confidence: {(selectedAvailable.confidence_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* View Case Modal (Offered) */}
        <Dialog.Root open={!!selectedDispatch} onOpenChange={(open) => { if (!open) setSelectedDispatch(null) }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9998]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#0a152e] border border-[#e3d4bf] dark:border-[#cdaa80]/25 shadow-2xl p-5 md:p-6 z-[9999]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-lg md:text-xl font-serif text-[#997953] dark:text-[#cdaa80]">
                    {selectedDispatch?.caseData.title ?? 'Untitled Case'}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                    {selectedDispatch ? formatDomain(selectedDispatch.caseData.domain) : ''}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-lg px-3 py-1.5 text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12254a]">
                  Close
                </Dialog.Close>
              </div>

              {selectedDispatch && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3 bg-[#fdf9f3] dark:bg-[#12254a]/60">
                    <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Citizen message</div>
                    <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                      {selectedDispatch.dispatch.intro_message}
                    </div>
                  </div>

                  <div className="text-sm font-sans text-[#2f261f] dark:text-white/85 leading-relaxed">
                    {selectedDispatch.caseData.incident_description ?? 'No description provided.'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Budget</div>
                      <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                        {formatBudget(selectedDispatch.caseData.budget_min, selectedDispatch.caseData.budget_max)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Sent</div>
                      <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                        {formatDate(selectedDispatch.dispatch.created_at)}
                      </div>
                    </div>
                  </div>

                  <details className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                    <summary className="cursor-pointer text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                      View packaged brief (AI brief + requirements + documents)
                    </summary>
                    <pre className="mt-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono text-[#2f261f]/80 dark:text-white/70 max-h-[260px] overflow-auto">
{JSON.stringify({
  ai_brief: selectedDispatch.dispatch.ai_brief,
  citizen_inputs: selectedDispatch.dispatch.citizen_inputs,
  documents: selectedDispatch.dispatch.documents,
}, null, 2)}
                    </pre>
                  </details>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedDispatch(null) }}
                      className="px-4 py-2 rounded-lg text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12254a]"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => { void handleSendOfferFromDispatch(selectedDispatch, offerAmountInput, offerMessageInput) }}
                      disabled={sendingOffer || selectedDispatch.offerStage === 'offered'}
                      className="px-4 py-2 rounded-lg text-sm font-sans border border-[#0f1e3f]/30 bg-[#0f1e3f] text-[#cdaa80] hover:bg-[#0f1e3f]/90 disabled:opacity-60"
                    >
                      {sendingOffer ? 'Sending…' : selectedDispatch.offerStage === 'offered' ? 'Waiting for acceptance' : 'Send offer'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3 space-y-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                        Offer amount (INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={offerAmountInput}
                        onChange={(e) => setOfferAmountInput(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#0f1e3f]/20 bg-[#fdf9f3] dark:bg-[#12284f]/70 px-3 py-2 text-sm font-sans text-[#0f1e3f] dark:text-white/85 outline-none focus:ring-2 focus:ring-[#cdaa80]/40"
                        placeholder="25000"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                        Offer message
                      </label>
                      <textarea
                        rows={4}
                        value={offerMessageInput}
                        onChange={(e) => setOfferMessageInput(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#0f1e3f]/20 bg-[#fdf9f3] dark:bg-[#12284f]/70 px-3 py-2 text-sm font-sans text-[#0f1e3f] dark:text-white/85 outline-none focus:ring-2 focus:ring-[#cdaa80]/40"
                        placeholder="Scope, timeline, engagement type, and next steps..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f3eadf; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(153,121,83,0.35); border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(153,121,83,0.55); }
          .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0f1e3f; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #213a56; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(205,170,128,0.5); }
        `}} />
      </div>
    </div>
  )
}
