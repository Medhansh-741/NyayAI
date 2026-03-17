'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { Menu, Home, Compass, Store, Briefcase } from 'lucide-react';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type PipelineRow = Database['public']['Tables']['case_pipeline']['Row'];

interface KanbanCard {
  pipeline: PipelineRow;
  caseData: CaseRow;
}

type ColumnId = 'requested' | 'in_progress' | 'done';

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu',        icon: Menu,      label: 'Menu' },
  { id: 'home',        icon: Home,      label: 'Home',        href: '/lawyerside/home' },
  { id: 'marketplace', icon: Store,     label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'yourcases',   icon: Briefcase, label: 'Your Cases',  href: '/lawyerside/yourcases' },
];

const COLUMNS: { id: ColumnId; title: string; color: string; headerBg: string; dotColor: string; stages: string[] }[] = [
  {
    id: 'requested',
    title: 'REQUESTED',
    color: '#3b82f6',
    headerBg: 'bg-blue-600',
    dotColor: 'bg-blue-500',
    stages: ['pending', 'offered', 'accepted'],
  },
  {
    id: 'in_progress',
    title: 'IN PROGRESS',
    color: '#d4a853',
    headerBg: 'bg-[#c49a45]',
    dotColor: 'bg-[#c49a45]',
    stages: ['active'],
  },
  {
    id: 'done',
    title: 'DONE',
    color: '#22c55e',
    headerBg: 'bg-green-600',
    dotColor: 'bg-green-500',
    stages: ['completed', 'withdrawn'],
  },
];

function getColumnForStage(stage: string | null): ColumnId {
  if (!stage) return 'requested';
  if (['pending', 'offered', 'accepted'].includes(stage)) return 'requested';
  if (stage === 'active') return 'in_progress';
  if (['completed', 'withdrawn'].includes(stage)) return 'done';
  return 'requested';
}

function getStageForColumn(columnId: ColumnId): string {
  switch (columnId) {
    case 'requested':   return 'accepted';
    case 'in_progress': return 'active';
    case 'done':        return 'completed';
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30)  return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const DOMAIN_LABELS: Record<string, string> = {
  consumer: 'Consumer', tenant: 'Tenant', labour: 'Labour', criminal: 'Criminal',
  cyber: 'Cyber', property: 'Property', family: 'Family', rti: 'RTI',
  corruption: 'Anti-Corruption', civil: 'Civil', other: 'General', tax: 'Tax',
  corporate: 'Corporate', intellectual_property: 'IP', constitutional: 'Constitutional',
  banking_finance: 'Banking', insurance: 'Insurance', matrimonial: 'Matrimonial',
  immigration: 'Immigration', environmental: 'Environmental', medical_negligence: 'Medical',
  motor_accident: 'Motor Accident', cheque_bounce: 'Cheque Bounce', debt_recovery: 'Debt Recovery',
  arbitration: 'Arbitration', divorce: 'Divorce', domestic_violence: 'DV', pocso: 'POCSO',
};

function formatDomain(d: string): string {
  return DOMAIN_LABELS[d] ?? d.replace(/_/g, ' ');
}

export default function YourCasesKanban() {
  const [cards, setCards]         = useState<KanbanCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError]     = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Fetch ──────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setDbError('Not authenticated.'); setIsLoading(false); return; }

      const { data: pipeline, error: pErr } = await supabase
        .from('case_pipeline')
        .select('*')
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });

      if (pErr) { setDbError(pErr.message); setIsLoading(false); return; }
      if (!pipeline || pipeline.length === 0) { setCards([]); setIsLoading(false); return; }

      const caseIds = pipeline.map(p => p.case_id);
      const { data: casesData, error: cErr } = await supabase
        .from('cases')
        .select('*')
        .in('id', caseIds);

      if (cErr) { setDbError(cErr.message); setIsLoading(false); return; }

      const caseMap = new Map((casesData ?? []).map(c => [c.id, c]));
      const merged = pipeline
        .filter(p => caseMap.has(p.case_id))
        .map(p => ({ pipeline: p, caseData: caseMap.get(p.case_id)! }));

      setCards(merged);
    } catch {
      setDbError('Unexpected error.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCases();
    const ch = supabase
      .channel('kanban-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_pipeline' }, () => fetchCases())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [fetchCases]);

  // ── Column data ────────────────────────────────────────
  function getCardsForColumn(colId: ColumnId) {
    const col = COLUMNS.find(c => c.id === colId)!;
    return cards.filter(c => col.stages.includes(c.pipeline.stage ?? 'pending'));
  }

  // ── Drag & Drop handlers ───────────────────────────────
  function onDragStart(e: React.DragEvent, pipelineId: string) {
    setDraggedId(pipelineId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pipelineId);
    // Make ghost semi-transparent
    const el = cardRefs.current.get(pipelineId);
    if (el) {
      requestAnimationFrame(() => { el.style.opacity = '0.4'; });
    }
  }

  function onDragEnd(pipelineId: string) {
    setDraggedId(null);
    setDragOverCol(null);
    const el = cardRefs.current.get(pipelineId);
    if (el) el.style.opacity = '1';
  }

  function onDragOver(e: React.DragEvent, colId: ColumnId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  }

  function onDragLeave(e: React.DragEvent, colId: ColumnId) {
    // Only reset if actually leaving the column
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      if (dragOverCol === colId) setDragOverCol(null);
    }
  }

  async function onDrop(e: React.DragEvent, targetCol: ColumnId) {
    e.preventDefault();
    setDragOverCol(null);
    const pipelineId = e.dataTransfer.getData('text/plain');
    if (!pipelineId) return;

    const card = cards.find(c => c.pipeline.id === pipelineId);
    if (!card) return;

    const currentCol = getColumnForStage(card.pipeline.stage);
    if (currentCol === targetCol) return;

    const newStage = getStageForColumn(targetCol);

    // Optimistic update
    setCards(prev =>
      prev.map(c =>
        c.pipeline.id === pipelineId
          ? { ...c, pipeline: { ...c.pipeline, stage: newStage as PipelineRow['stage'] } }
          : c
      )
    );

    // Animate the dropped card
    const el = cardRefs.current.get(pipelineId);
    if (el) {
      gsap.fromTo(el,
        { scale: 1.08, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' },
        { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', duration: 0.4, ease: 'elastic.out(1, 0.5)' }
      );
    }

    // Persist to Supabase
    const { error } = await supabase
      .from('case_pipeline')
      .update({ stage: newStage as PipelineRow['stage'], updated_at: new Date().toISOString() })
      .eq('id', pipelineId);

    if (error) {
      console.error('Failed to update stage:', error);
      // Revert on error
      fetchCases();
    }
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f]">
      <div className="hidden md:block md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar navItems={LAWYER_NAV_ITEMS} />
      </div>
      <div className="md:hidden">
        <Sidebar navItems={LAWYER_NAV_ITEMS} />
      </div>

      <div className="flex-1 p-6 md:p-10 text-gray-900 dark:text-white font-serif overflow-x-auto">
        {/* Header */}
        <div className="mb-8 max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2">
            YOUR CASES
          </h1>
          <p className="text-gray-600 dark:text-white/70 text-[15px] font-sans">
            Drag cases between columns to update their status.
          </p>
          {!isLoading && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-sans px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-green-400 animate-pulse" />
              {cards.length} case{cards.length !== 1 ? 's' : ''} total
            </div>
          )}
        </div>

        {/* Board */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#997953] dark:border-[#cdaa80]" />
          </div>
        ) : dbError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-400/30 rounded-xl max-w-lg mx-auto">
            <p className="text-red-400 font-sans text-sm">Failed to load cases</p>
            <p className="text-red-400/60 font-mono text-xs mt-1">{dbError}</p>
            <button onClick={fetchCases} className="mt-4 px-4 py-2 bg-[#997953]/10 text-[#997953] border border-[#997953]/20 rounded-lg text-sm hover:bg-[#997953]/15 dark:bg-[#cdaa80]/20 dark:text-[#cdaa80] dark:border-transparent dark:hover:bg-[#cdaa80]/25 transition-colors">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
            {COLUMNS.map(col => {
              const colCards = getCardsForColumn(col.id);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => onDragOver(e, col.id)}
                  onDragLeave={(e) => onDragLeave(e, col.id)}
                  onDrop={(e) => onDrop(e, col.id)}
                  className={`flex flex-col rounded-xl transition-all duration-300 min-h-[500px] ${
                    isOver
                      ? 'bg-white/5 dark:bg-white/[0.03]'
                      : 'bg-transparent'
                  }`}
                  style={isOver ? { outline: `2px solid ${col.color}`, outlineOffset: '4px', borderRadius: '12px' } : undefined}
                >
                  {/* Column Header */}
                  <div
                    className={`${col.headerBg} rounded-t-xl px-5 py-3 flex items-center justify-between`}
                  >
                    <h2 className="text-white font-bold text-sm tracking-[0.15em] font-sans">
                      {col.title}
                    </h2>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full font-sans">
                      {colCards.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div
                    className={`flex-1 rounded-b-xl border-x border-b transition-colors duration-200 p-3 space-y-3 ${
                      isOver
                        ? 'border-white/20 dark:border-white/10 bg-white/[0.02]'
                        : 'border-[#1a2d52] dark:border-[#1a2d52] bg-[#0a152e]/30 dark:bg-[#0a152e]/50'
                    }`}
                  >
                    {colCards.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-white/20 text-sm font-sans italic">
                        {isOver ? 'Drop here' : 'No cases'}
                      </div>
                    ) : (
                      colCards.map(card => {
                        const pending = timeAgo(card.pipeline.created_at);

                        return (
                          <div
                            key={card.pipeline.id}
                            ref={(el) => { if (el) cardRefs.current.set(card.pipeline.id, el); }}
                            draggable
                            onDragStart={(e) => onDragStart(e, card.pipeline.id)}
                            onDragEnd={() => onDragEnd(card.pipeline.id)}
                            className={`group relative rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-200 border ${
                              draggedId === card.pipeline.id
                                ? 'opacity-40 scale-95'
                                : 'hover:-translate-y-0.5 hover:shadow-lg'
                            }`}
                            style={{
                              background: 'linear-gradient(135deg, #d4a853 0%, #c49a45 40%, #b8893c 100%)',
                              borderColor: 'rgba(0,0,0,0.08)',
                            }}
                          >
                            {/* Sheen */}
                            <div className="absolute inset-0 rounded-lg pointer-events-none"
                              style={{
                                background: 'linear-gradient(180deg, rgba(255,230,160,0.2) 0%, transparent 40%, rgba(0,0,0,0.05) 100%)',
                              }}
                            />

                            <div className="relative z-10">
                              {/* Top row: domain + time */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold tracking-wider font-sans text-[#0f1e3f]/60 uppercase">
                                  {formatDomain(card.caseData.domain)}
                                </span>
                                <span className="text-[10px] font-sans text-[#0f1e3f]/50">
                                  {pending}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="text-[14px] font-semibold text-[#0f1e3f] leading-snug mb-1.5 line-clamp-1">
                                {card.caseData.title ?? 'Untitled Case'}
                              </h3>

                              {/* Brief */}
                              <p className="text-[11px] text-[#0f1e3f]/65 font-sans leading-relaxed line-clamp-2 mb-3">
                                {card.caseData.incident_description ?? 'No description.'}
                              </p>

                              {/* Bottom row: status dot + stage */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                                  <span className="text-[10px] font-sans font-medium text-[#0f1e3f]/70 capitalize">
                                    {(card.pipeline.stage ?? 'pending').replace(/_/g, ' ')}
                                  </span>
                                </div>
                                {card.pipeline.offer_amount && (
                                  <span className="text-[11px] font-serif font-bold text-[#0f1e3f]/80">
                                    ₹{card.pipeline.offer_amount.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Drag handle indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
                              <svg className="w-3.5 h-3.5 text-[#0f1e3f]" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                              </svg>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Drop zone indicator */}
                    {isOver && (
                      <div
                        className="border-2 border-dashed rounded-lg h-20 flex items-center justify-center text-sm font-sans animate-pulse"
                        style={{ borderColor: col.color + '60', color: col.color + '80' }}
                      >
                        Drop case here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
