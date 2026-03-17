'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Sidebar, type NavItem } from '../../../../components/sidebar'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { Menu, Home, Compass, Store, Gavel } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'

type CaseRow = Database['public']['Tables']['cases']['Row']
type PipelineRow = Database['public']['Tables']['case_pipeline']['Row']
type PipelineStage = Database['public']['Enums']['pipeline_stage']
type KanbanStage = 'accepted' | 'active' | 'completed'

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
  | 'created_at'
>

interface KanbanItem {
  pipeline: PipelineRow
  caseData: CasePreview
}

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'my-cases', icon: Gavel, label: 'My Cases', href: '/lawyerside/my-cases' },
]

const COLUMN_CONFIG: Array<{ title: string; stage: KanbanStage; emptyText: string }> = [
  { title: 'Requested', stage: 'accepted', emptyText: 'No requested cases yet' },
  { title: 'In Progress', stage: 'active', emptyText: 'No in-progress cases yet' },
  { title: 'Done', stage: 'completed', emptyText: 'No completed cases yet' },
]

const DOMAIN_LABELS: Record<string, string> = {
  consumer: 'Consumer Disputes',
  tenant: 'Tenant / Rent',
  labour: 'Labour & Employment',
  criminal: 'Criminal Law',
  cyber: 'Cyber Crime',
  property: 'Property Law',
  family: 'Family Law',
  rti: 'RTI',
  corruption: 'Anti-Corruption',
  civil: 'Civil Law',
  other: 'General Practice',
  tax: 'Tax Law',
  corporate: 'Corporate / Business',
  intellectual_property: 'Intellectual Property',
  constitutional: 'Constitutional / PIL',
  banking_finance: 'Banking & Finance',
  insurance: 'Insurance',
  matrimonial: 'Matrimonial',
  immigration: 'Immigration',
  environmental: 'Environmental Law',
  medical_negligence: 'Medical Negligence',
  motor_accident: 'Motor Accident Claims',
  cheque_bounce: 'Cheque Bounce (NI Act)',
  debt_recovery: 'Debt Recovery',
  arbitration: 'Arbitration & ADR',
  service_matters: 'Service Matters',
  land_acquisition: 'Land Acquisition',
  wills_succession: 'Wills & Succession',
  domestic_violence: 'Domestic Violence',
  pocso: 'POCSO',
  sc_st_atrocities: 'SC/ST Atrocities Act',
  divorce: 'Divorce',
}

function formatDomain(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain.replace(/_/g, ' ')
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'Budget not specified'
  if (min && !max) return `From Rs ${min.toLocaleString('en-IN')}`
  if (!min && max) return `Up to Rs ${max.toLocaleString('en-IN')}`
  return `Rs ${min!.toLocaleString('en-IN')} - ${max!.toLocaleString('en-IN')}`
}

export default function LawyerMyCasesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<KanbanItem[]>([])
  const [updatingPipelineId, setUpdatingPipelineId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null)
  const [removingPipelineId, setRemovingPipelineId] = useState<string | null>(null)

  const handleProfileClick = () => {
    router.push('/lawyerside/profile')
  }

  const fetchMyCases = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setError('Not authenticated. Please log in.')
      setIsLoading(false)
      return
    }

    const { data: pipelineRows, error: pipelineError } = await supabase
      .from('case_pipeline')
      .select('*')
      .eq('lawyer_id', authData.user.id)
      .in('stage', ['accepted', 'active', 'completed'])
      .order('updated_at', { ascending: false })

    if (pipelineError) {
      setError(pipelineError.message)
      setIsLoading(false)
      return
    }

    if (!pipelineRows || pipelineRows.length === 0) {
      setItems([])
      setIsLoading(false)
      return
    }

    const caseIds = pipelineRows.map((row) => row.case_id)
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      // keep citizen anonymous for lawyers: do not fetch citizen_id
      .select('id, title, domain, status, state, district, incident_description, incident_date, budget_min, budget_max, created_at')
      .in('id', caseIds)

    if (casesError) {
      setError(casesError.message)
      setIsLoading(false)
      return
    }

    const caseMap = new Map((casesData ?? []).map((row) => [row.id, row]))
    const merged = pipelineRows
      .filter((pipelineRow) => caseMap.has(pipelineRow.case_id))
      .map((pipelineRow) => ({ pipeline: pipelineRow, caseData: caseMap.get(pipelineRow.case_id)! }))

    setItems(merged)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void fetchMyCases()

    const channel = supabase
      .channel('lawyer-my-cases-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_pipeline' }, () => {
        void fetchMyCases()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchMyCases])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const grouped = useMemo(() => {
    return {
      accepted: items.filter((item) => item.pipeline.stage === 'accepted'),
      active: items.filter((item) => item.pipeline.stage === 'active'),
      completed: items.filter((item) => item.pipeline.stage === 'completed'),
    }
  }, [items])

  const moveStage = useCallback(async (item: KanbanItem, nextStage: PipelineStage) => {
    setUpdatingPipelineId(item.pipeline.id)

    const updates: Partial<PipelineRow> & { stage: PipelineStage } = { stage: nextStage }
    if (nextStage === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error: pipelineError } = await supabase
      .from('case_pipeline')
      .update(updates)
      .eq('id', item.pipeline.id)

    if (pipelineError) {
      setError(pipelineError.message)
      setUpdatingPipelineId(null)
      return
    }

    const caseStatus = nextStage === 'completed' ? 'completed' : 'active'
    const caseUpdate: Partial<CaseRow> = {
      status: caseStatus,
      is_seeking_lawyer: false,
    }
    if (nextStage === 'completed') {
      caseUpdate.completed_at = new Date().toISOString()
    }

    const { error: caseError } = await supabase
      .from('cases')
      .update(caseUpdate)
      .eq('id', item.caseData.id)

    if (caseError) {
      setError(caseError.message)
    }

    setUpdatingPipelineId(null)
    await fetchMyCases()
  }, [fetchMyCases])

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const pipelineId = String(active.id)
    const overId = String(over.id)

    const targetStage = (overId.startsWith('column:')
      ? overId.replace('column:', '')
      : (items.find((it) => it.pipeline.id === overId)?.pipeline.stage ?? overId)
    ) as KanbanStage
    if (!['accepted', 'active', 'completed'].includes(targetStage)) return

    const item = items.find((it) => it.pipeline.id === pipelineId)
    if (!item) return

    if (item.pipeline.stage === targetStage) return
    await moveStage(item, targetStage)
  }, [items, moveStage])

  const removeFromLawyerBoard = useCallback(async (item: KanbanItem) => {
    setRemovingPipelineId(item.pipeline.id)

    const { error: pipelineError } = await supabase
      .from('case_pipeline')
      .update({ stage: 'withdrawn' })
      .eq('id', item.pipeline.id)

    if (pipelineError) {
      setError(pipelineError.message)
      setRemovingPipelineId(null)
      return
    }

    setRemovingPipelineId(null)
    if (selectedItem?.pipeline.id === item.pipeline.id) {
      setSelectedItem(null)
    }
    await fetchMyCases()
  }, [fetchMyCases, selectedItem])

  function DraggableCard({ item }: { item: KanbanItem }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.pipeline.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <article
        ref={setNodeRef}
        style={style}
        className={`relative rounded-lg border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3 bg-[#fdf9f3] dark:bg-[#12254a]/60 cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-70 ring-2 ring-[#997953]/30 dark:ring-[#cdaa80]/30' : ''
        }`}
        onClick={() => setSelectedItem(item)}
        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedItem(item) }}
        {...attributes}
        {...listeners}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void removeFromLawyerBoard(item)
          }}
          disabled={removingPipelineId === item.pipeline.id}
          className="absolute top-2 right-2 w-6 h-6 rounded-full border border-[#997953]/30 bg-white/80 text-[#5b4b3d] hover:bg-[#0f1e3f] hover:text-[#cdaa80] transition-colors disabled:opacity-60"
          title="Remove from My Cases"
        >
          {removingPipelineId === item.pipeline.id ? '…' : '×'}
        </button>
        <div className="text-[10px] uppercase font-bold tracking-wide text-[#997953] dark:text-[#cdaa80] mb-1">
          {formatDomain(item.caseData.domain)}
        </div>
        <h3 className="font-semibold text-sm text-[#2f261f] dark:text-white/90 mb-1 line-clamp-2">{item.caseData.title ?? 'Untitled Case'}</h3>
        <p className="text-xs text-[#5b4b3d] dark:text-white/70 mb-2 line-clamp-3">{item.caseData.incident_description ?? 'No description provided.'}</p>
        <div className="text-xs font-sans text-[#4a3f34] dark:text-white/60">{formatBudget(item.caseData.budget_min, item.caseData.budget_max)}</div>
      </article>
    )
  }

  function DroppableColumn({ id, children }: { id: string; children: ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id })
    return (
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[72px] rounded-lg p-0.5 transition-colors ${isOver ? 'bg-[#997953]/5 dark:bg-[#cdaa80]/10' : ''}`}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f]">
      <div className="hidden md:block md:sticky md:top-0 md:h-screen shrink-0 z-[1000]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>
      <div className="md:hidden relative z-[1000]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>

      <div className="flex-1 pt-20 px-6 pb-6 md:p-10 text-gray-900 dark:text-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2 font-serif">My Cases</h1>
            <p className="text-gray-600 dark:text-white/70 text-[15px] font-sans">Track your requested, in-progress, and completed cases in one Kanban board.</p>
            {error && <p className="mt-2 text-sm text-red-500 font-sans">{error}</p>}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#997953] dark:border-[#cdaa80]" />
            </div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => { void onDragEnd(e) }}>
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 ${updatingPipelineId ? 'opacity-80 pointer-events-none' : ''}`}>
                  {COLUMN_CONFIG.map((column) => {
                    const list: KanbanItem[] = grouped[column.stage]
                    const columnId = `column:${column.stage}`
                    return (
                      <section key={column.stage} className="rounded-xl border border-[#d8c1a1] dark:border-[#cdaa80]/30 bg-white/90 dark:bg-[#0a152e]/70 p-4 flex flex-col min-h-[70vh]" id={columnId}>
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-serif text-[#997953] dark:text-[#cdaa80]">{column.title}</h2>
                          <span className="text-xs font-sans text-[#5b4b3d] dark:text-white/70">{list.length}</span>
                        </div>

                        <SortableContext items={list.map((i) => i.pipeline.id)} strategy={verticalListSortingStrategy}>
                          <DroppableColumn id={columnId}>
                            {list.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-[#d8c1a1] dark:border-[#cdaa80]/30 p-4 text-sm text-[#5b4b3d] dark:text-white/70 font-sans">
                                {column.emptyText}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {list.map((item) => (
                                  <DraggableCard key={item.pipeline.id} item={item} />
                                ))}
                              </div>
                            )}
                          </DroppableColumn>
                        </SortableContext>
                      </section>
                    )
                  })}
                </div>
              </DndContext>

              <Dialog.Root open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null) }}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#0a152e] border border-[#e3d4bf] dark:border-[#cdaa80]/25 shadow-2xl p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Dialog.Title className="text-lg md:text-xl font-serif text-[#997953] dark:text-[#cdaa80]">
                          {selectedItem?.caseData.title ?? 'Untitled Case'}
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                          {selectedItem ? formatDomain(selectedItem.caseData.domain) : ''}
                        </Dialog.Description>
                      </div>
                      <Dialog.Close className="rounded-lg px-3 py-1.5 text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12254a]">
                        Close
                      </Dialog.Close>
                    </div>

                    {selectedItem && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-sans text-[#2f261f] dark:text-white/85 leading-relaxed">
                          {selectedItem.caseData.incident_description ?? 'No description provided.'}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Budget</div>
                            <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80">
                              {formatBudget(selectedItem.caseData.budget_min, selectedItem.caseData.budget_max)}
                            </div>
                          </div>
                          <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">Status</div>
                            <div className="mt-1 text-sm font-sans text-[#2f261f] dark:text-white/80 capitalize">
                              {selectedItem.pipeline.stage ?? 'accepted'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedItem.caseData.state && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#997953]/10 text-[#5b4b3d] dark:bg-[#cdaa80]/10 dark:text-white/70">
                              {selectedItem.caseData.district ? `${selectedItem.caseData.district}, ` : ''}{selectedItem.caseData.state}
                            </span>
                          )}
                          {selectedItem.pipeline.offer_note && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#997953]/10 text-[#5b4b3d] dark:bg-[#cdaa80]/10 dark:text-white/70">
                              Note: {selectedItem.pipeline.offer_note}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
