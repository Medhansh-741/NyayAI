'use client';

import React, { useEffect, useMemo, useRef, useState,} from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Sidebar } from '../../../../components/sidebar';
import { useTheme } from '../../../../components/themeprovider';
import { supabase } from '@/lib/supabase/client';
import { getCitizenCases } from '@/lib/db/cases';
import { getNotifications, markAllNotificationsRead, markNotificationRead, subscribeToNotifications } from '@/lib/db/notifications';
import type { Database } from '@/types/supabase';
import * as Dialog from '@radix-ui/react-dialog';
import { acceptOffer, getCasePipelineForCitizen } from '@/lib/db/pipeline';
import { toast } from 'sonner';
import NextLink from 'next/link';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

function formatUiStatus(caseRow: CaseRow): string {
  if (caseRow.status === 'completed') return 'Case Completed'
  if (caseRow.status === 'lawyer_matched') return 'Lawyer Matched'
  if (caseRow.status === 'seeking_lawyer') return 'Seeking Lawyer'
  if (caseRow.status === 'analysis_complete') return 'AI Analysis Complete'
  if (caseRow.status === 'analysis_pending') return 'Under AI Analysis'
  if (caseRow.status === 'draft') return 'Draft'
  return (caseRow.status ?? 'Submitted').replace(/_/g, ' ')
}

export default function CaseHistory() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const cardsWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchIconRef = useRef<SVGSVGElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clickedCardId, setClickedCardId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'title_asc' | 'title_desc'>('latest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const [dbCases, setDbCases] = useState<CaseRow[]>([])
  const [dbError, setDbError] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null)
  const [offersLoading, setOffersLoading] = useState(false)
  const [offersError, setOffersError] = useState<string | null>(null)
  const [offers, setOffers] = useState<Database['public']['Tables']['case_pipeline']['Row'][]>([])
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [recentlyMatchedIds, setRecentlyMatchedIds] = useState<Set<string>>(new Set())
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement | null>(null)

  const onlyLawyerAcceptance = (rows: NotificationRow[]) =>
    rows.filter((row) => {
      if (row.type === 'offer_accepted') return true
      const title = (row.title ?? '').toLowerCase()
      const body = (row.body ?? '').toLowerCase()
      return title.includes('accepted') || body.includes('accepted')
    })

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return 'Just now'
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diffMin = Math.floor((now - then) / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d ago`
  }

  const extractCaseId = (notification: NotificationRow) => {
    const payload = notification.data as Record<string, unknown> | null
    const candidate = payload?.case_id ?? payload?.caseId
    return typeof candidate === 'string' ? candidate : null
  }

  useEffect(() => {
    async function load() {
      setDbError(null)
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        setDbError('Please log in to view your cases.')
        setDbCases([])
        return
      }

      const { data, error } = await getCitizenCases(authData.user.id)
      if (error) {
        setDbError(error.message)
        setDbCases([])
      } else {
        setDbCases(data ?? [])
      }
    }
    void load()

    // ── Real-time subscription ─────────────────────────────
    const channel = supabase
      .channel('citizen-cases-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cases',
        },
        async (payload) => {
          const updatedCase = payload.new as CaseRow;
          const oldCase = payload.old as CaseRow;

          // Only care if it's the current citizen's case
          const { data: { user } } = await supabase.auth.getUser();
          if (user && updatedCase.citizen_id === user.id) {
            // Check for specific transition: seeking_lawyer -> lawyer_matched
            if (oldCase.status === 'seeking_lawyer' && updatedCase.status === 'lawyer_matched') {
              toast.success(`Great news! A lawyer has accepted your case: ${updatedCase.title}`, {
                description: 'You can now view the details and start collaborating.',
                duration: 8000,
              });

              // Track this ID for visual highlighting
              setRecentlyMatchedIds((prev) => new Set(prev).add(updatedCase.id));
              // Remove highlight after 1 minute (or when they refresh)
              setTimeout(() => {
                setRecentlyMatchedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(updatedCase.id);
                  return next;
                });
              }, 60000);
            }

            // Refresh the case list to reflect any status change immediately
            const { data } = await getCitizenCases(user.id);
            if (data) setDbCases(data);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [])

  const loadAcceptanceNotifications = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return

    setNotificationLoading(true)
    const { data, error } = await getNotifications(authData.user.id, 30)
    setNotificationLoading(false)
    if (error) return

    const filtered = onlyLawyerAcceptance(data ?? [])
    setNotifications(filtered)
    setUnreadNotificationCount(filtered.filter((row) => !row.is_read).length)
  }

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToNotifications> | null = null

    const init = async () => {
      await loadAcceptanceNotifications()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) return
      channel = subscribeToNotifications(authData.user.id, async () => {
        await loadAcceptanceNotifications()
      })
    }

    void init()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [])

  const openCaseDetails = async (caseId: string) => {
    const caseRow = dbCases.find((c) => c.id === caseId) ?? null
    setSelectedCase(caseRow)
    setOffersError(null)
    setOffers([])
    if (!caseRow) return

    // Always fetch the latest case row for the modal so status + AI draft fields are synced.
    const { data: freshCase, error: freshErr } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .maybeSingle()
    if (!freshErr && freshCase) {
      setSelectedCase(freshCase as CaseRow)
    }

    setOffersLoading(true)
    const { data: pipelineRows, error: pipelineErr } = await getCasePipelineForCitizen(caseRow.id)
    if (pipelineErr) setOffersError(pipelineErr.message)
    const rows = (pipelineRows ?? []) as Database['public']['Tables']['case_pipeline']['Row'][]
    setOffers(rows.filter((r) => r.stage === 'offered'))
    setOffersLoading(false)
  }

  const handleAcceptOffer = async (pipelineId: string) => {
    if (!selectedCase) return
    setOffersError(null)
    setAcceptingOfferId(pipelineId)
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setOffersError('Please log in to accept offers.')
      setAcceptingOfferId(null)
      return
    }

    const { error } = await acceptOffer(pipelineId, selectedCase.id)
    if (error) {
      setOffersError(error.message)
      setAcceptingOfferId(null)
      return
    }

    // Refresh offers + the case list so the status updates in UI
    const { data: pipelineRows, error: pipelineErr } = await getCasePipelineForCitizen(selectedCase.id)
    if (pipelineErr) setOffersError(pipelineErr.message)
    const rows = (pipelineRows ?? []) as Database['public']['Tables']['case_pipeline']['Row'][]
    setOffers(rows.filter((r) => r.stage === 'offered'))

    const { data: casesData, error: casesErr } = await getCitizenCases(authData.user.id)
    if (casesErr) setDbError(casesErr.message)
    else setDbCases(casesData ?? [])

    setAcceptingOfferId(null)
  }

  const handleMarkAllRead = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return
    await markAllNotificationsRead(authData.user.id)
    setNotifications((prev) => prev.map((row) => ({ ...row, is_read: true })))
    setUnreadNotificationCount(0)
  }

  const handleNotificationClick = async (notification: NotificationRow) => {
    await markNotificationRead(notification.id)
    setNotifications((prev) =>
      prev.map((row) => (row.id === notification.id ? { ...row, is_read: true } : row))
    )
    setUnreadNotificationCount((prev) => Math.max(prev - 1, 0))

    const caseId = extractCaseId(notification)
    if (caseId) {
      await openCaseDetails(caseId)
    }
    setNotificationOpen(false)
  }

  const sortOptions: Array<{ label: string; value: typeof sortOption }> = [
    { label: 'Latest Case', value: 'latest' },
    { label: 'Oldest Case', value: 'oldest' },
    { label: 'Title A-Z', value: 'title_asc' },
    { label: 'Title Z-A', value: 'title_desc' },
  ];

  const uiCases = useMemo(() => {
    return dbCases.map((c) => ({
      id: c.id,
      title: c.title ?? 'Untitled Case',
      description: c.incident_description ?? 'No description provided.',
      domain: (c.domain ?? 'other').replace(/_/g, ' '),
      date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
      status: formatUiStatus(c),
    }))
  }, [dbCases])

  const filteredCases = uiCases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort the filtered cases based on the selected option
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortOption === 'oldest' || sortOption === 'latest') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOption === 'latest' ? dateB - dateA : dateA - dateB;
    }

    if (sortOption === 'title_asc' || sortOption === 'title_desc') {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (titleA < titleB) return sortOption === 'title_asc' ? -1 : 1;
      if (titleA > titleB) return sortOption === 'title_asc' ? 1 : -1;
      return 0;
    }

    return 0;
  });

  // ── Click outside ──────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── GSAP dropdown ──────────────────────────────────────
  useEffect(() => {
    if (!dropdownContentRef.current) return;
    if (isSortOpen) {
      gsap.fromTo(
        dropdownContentRef.current,
        { opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power2.out', display: 'block' }
      );
    } else {
      gsap.to(dropdownContentRef.current, {
        opacity: 0,
        y: -10,
        scaleY: 0.9,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          if (dropdownContentRef.current) dropdownContentRef.current.style.display = 'none';
        }
      });
    }
  }, [isSortOpen]);

  // Initial page entrance
  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.fromTo(
        '.cases-top-nav',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo(
        '.cases-search-sort',
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );
    },
    { scope: pageRef }
  );


  // Card stagger - re-triggers on sort/search
  useGSAP(
    () => {
      gsap.fromTo(
        '.case-card',
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          stagger: 0.08, 
          duration: 0.6, 
          ease: 'back.out(1.2)', 
          clearProps: 'all'
        }
      );
    },
    { scope: cardsWrapperRef, dependencies: [sortOption, searchQuery], revertOnUpdate: true }
  );

  const handleSearchFocus = () => {
    if (!searchContainerRef.current || !searchIconRef.current) return;
    gsap.to(searchContainerRef.current, {
      scale: 1.01,
      boxShadow: isDark
        ? '0 0 0 1px rgba(205,170,128,0.65), 0 14px 35px rgba(8,18,40,0.42)'
        : '0 0 0 1px rgba(153,121,83,0.35), 0 10px 24px rgba(68,56,49,0.12)',
      duration: 0.22,
      ease: 'power2.out'
    });
    gsap.to(searchIconRef.current, { color: isDark ? '#cdaa80' : '#997953', scale: 1.08, duration: 0.22, ease: 'power2.out' });
  };

  const handleSearchBlur = () => {
    if (!searchContainerRef.current || !searchIconRef.current) return;
    gsap.to(searchContainerRef.current, {
      scale: 1,
      boxShadow: isDark
        ? '0 8px 24px rgba(8,18,40,0.28)'
        : '0 8px 24px rgba(68,56,49,0.08)',
      duration: 0.22,
      ease: 'power2.out'
    });
    gsap.to(searchIconRef.current, {
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(68,56,49,0.4)',
      scale: 1,
      duration: 0.22,
      ease: 'power2.out'
    });
  };

  return (
    <div
      ref={pageRef}
      className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f] transition-colors duration-300"
    >
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-8 text-gray-900 dark:text-white flex flex-col pb-24 md:pb-8">
        {/* Top Header/Nav Area */}
        <div className="cases-top-nav relative z-[120] flex items-center justify-between border-b border-[#d8c1a1] dark:border-[#213a56] pb-2 mb-6 shrink-0">
          <nav className="flex gap-6 text-sm">
            <button className="text-[#cdaa80] border-b-2 border-[#cdaa80] pb-2 font-medium">
              Cases
            </button>
          </nav>

          <div ref={notificationRef} className="relative z-[130]">
            <button
              title="Notifications"
              onClick={async () => {
                const next = !notificationOpen
                setNotificationOpen(next)
                if (next) {
                  await loadAcceptanceNotifications()
                }
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-full border border-[#d8c1a1] dark:border-white/10 bg-white dark:bg-[#12284f]/80 text-[#443831] dark:text-[#cdaa80] hover:bg-[#f9f2e8] dark:hover:bg-[#213a56] transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b0372f] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-[320px] md:w-[360px] rounded-2xl border border-[#d8c1a1]/60 dark:border-[#cdaa80]/20 bg-white/95 dark:bg-[#12284f]/95 backdrop-blur-md shadow-2xl overflow-hidden z-[9999]">
                <div className="px-4 py-3 border-b border-[#e8d7c1] dark:border-[#cdaa80]/20 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] uppercase tracking-[1.5px] text-[#7b5f40] dark:text-[#cdaa80] font-semibold">Notifications</p>
                    <p className="text-[12px] text-[#6b5a49] dark:text-white/70">Lawyer acceptance updates</p>
                  </div>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#997953] dark:text-[#e0c3a0] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {notificationLoading ? (
                    <div className="px-4 py-5 text-sm text-[#6b5a49] dark:text-white/70">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-[#6b5a49] dark:text-white/70">No lawyer acceptance notifications yet.</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { void handleNotificationClick(item) }}
                        className={`w-full text-left block px-4 py-3 border-b border-[#efe1ce] dark:border-[#cdaa80]/10 hover:bg-[#f9f2e8] dark:hover:bg-[#1a3358] transition-colors ${
                          item.is_read ? 'opacity-80' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-semibold text-[#3f3124] dark:text-white/90 leading-snug">
                            {item.title || 'A lawyer accepted your request'}
                          </p>
                          <span className="text-[11px] text-[#7b5f40] dark:text-white/60 whitespace-nowrap">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#6b5a49] dark:text-white/75 leading-relaxed">
                          {item.body || 'Tap to open your case updates.'}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 bg-[#f8efe2] dark:bg-[#10264a] border-t border-[#e8d7c1] dark:border-[#cdaa80]/20">
                  <NextLink href="/citizen/cases" className="text-[12px] font-semibold text-[#997953] dark:text-[#e0c3a0] hover:underline">
                    View all case updates
                  </NextLink>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters Area */}
        <div className="cases-search-sort flex flex-col md:flex-row justify-between items-center gap-6 mb-6 shrink-0 font-sans w-full relative z-20">
          <div
            ref={searchContainerRef}
            className="search-shell w-full relative group rounded-full border border-[#d8c1a1] dark:border-[#2b4b6b] bg-white dark:bg-[#12284f]/85 shadow-[0_8px_24px_rgba(68,56,49,0.08)] dark:shadow-[0_8px_24px_rgba(8,18,40,0.28)] overflow-hidden transition-colors duration-300"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                ref={searchIconRef}
                className="h-4 w-4 text-[#443831]/40 dark:text-white/40 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-transparent border-none rounded-full pl-11 pr-4 py-3 text-sm outline-none text-[#443831] dark:text-white placeholder-[#443831]/40 dark:placeholder-white/40"
              placeholder="Search your legal cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>

          {/* Sort Dropdown - Marketplace Style */}
          <div className="relative z-30 shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsSortOpen((v) => !v)}
              className={`flex items-center gap-3 bg-white dark:bg-[#0f1e3f] border border-[#d8c1a1] dark:border-[#cdaa80]/50 text-[#443831] dark:text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#997953]/20 dark:focus:ring-[#cdaa80]/30 outline-none shadow-sm w-56 ${
                isSortOpen
                  ? 'bg-[#f7efe5] ring-1 ring-[#997953]/30 dark:bg-[#213a56] dark:ring-[#cdaa80]/50'
                  : 'hover:bg-[#f9f4ec] dark:hover:bg-[#213a56]'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0 opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="flex-1 text-left text-sm truncate">
                {sortOptions.find((opt) => opt.value === sortOption)?.label || 'Sort'}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                  isSortOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              ref={dropdownContentRef}
              className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0f1e3f] border border-[#e3d4bf] dark:border-[#cdaa80]/30 rounded-lg shadow-[0_18px_45px_rgba(68,56,49,0.14)] dark:shadow-2xl overflow-hidden"
              style={{ display: 'none' }}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortOption(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortOption === option.value
                        ? 'bg-[#f6ede1] text-[#997953] font-medium dark:bg-[#cdaa80]/20 dark:text-[#cdaa80]'
                        : 'text-[#5b4b3d] hover:bg-[#f8f1e7] hover:text-[#443831] dark:text-white/80 dark:hover:bg-[#213a56] dark:hover:text-[#cdaa80]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Cases List */}
        <div
          ref={cardsWrapperRef}
          className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar"
        >
          {sortedCases.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setClickedCardId(c.id);
                setTimeout(() => setClickedCardId(null), 1000);
              }}
              className={`
              case-card bg-white dark:bg-[#cdaa80] rounded-lg p-6 border border-[#e3d4bf] dark:border-transparent 
              hover:shadow-xl hover:translate-y-[-2px] cursor-pointer text-left w-full
              transition-all duration-300 relative group overflow-hidden
            `}
            >
              {/* Click ripple animation effect */}
              {clickedCardId === c.id && (
                <span className="absolute inset-0 bg-[#0f1e3f]/5 animate-pulse pointer-events-none rounded-lg"></span>
              )}

              <div className="flex justify-between items-start mb-3 gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  {/* Domain Tag like Marketplace */}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0f1e3f]/60 bg-[#0f1e3f]/5 px-2 py-0.5 rounded w-fit">
                    {c.domain}
                  </span>
                  <h3 className="text-[#0f1e3f] font-bold text-xl tracking-tight">{c.title}</h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`
                  inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold border transition-colors
                  ${c.status === 'Submitted' ? 'bg-[#0f1e3f] text-[#cdaa80] border-transparent' :
                      c.status === 'Case Completed' ? 'bg-[#0f1e3f]/20 text-[#0f1e3f] border-[#0f1e3f]/10' :
                        'bg-transparent text-[#0f1e3f] border-[#0f1e3f]/30'}
                `}>
                    {c.status}
                  </span>
                  {recentlyMatchedIds.has(c.id) && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                      Just Matched!
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[#0f1e3f]/80 text-[15px] leading-relaxed mb-6 pr-10 relative z-10 font-medium">
                {c.description}
              </p>

              <div className="flex items-center justify-between border-t border-[#0f1e3f]/10 pt-4 relative z-10">
                <div className="flex items-center text-[#0f1e3f]/60 text-[13px] font-semibold">
                  <span>Domain: {c.domain}</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span>Date: {c.date}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void openCaseDetails(c.id) }}
                  className="flex items-center gap-1 text-[#0f1e3f] font-bold text-sm hover:underline"
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {filteredCases.length === 0 && (
            <div className="text-center py-12 text-[#443831]/60 dark:text-white/50">
              {dbError ? 'No cases to show.' : 'No cases found matching your search.'}
            </div>
          )}
        </div>

        <Dialog.Root open={!!selectedCase} onOpenChange={(open) => { if (!open) setSelectedCase(null) }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9998]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#0a152e] border border-[#e3d4bf] dark:border-[#cdaa80]/25 shadow-2xl p-5 md:p-6 z-[9999]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-lg md:text-xl font-serif text-[#997953] dark:text-[#cdaa80]">
                    {selectedCase?.title ?? 'Untitled Case'}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                    {selectedCase ? selectedCase.domain.replace(/_/g, ' ') : ''}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-lg px-3 py-1.5 text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12284f]">
                  Close
                </Dialog.Close>
              </div>

              {selectedCase && (
                <div className="mt-4 space-y-4">
                  <div className="text-sm font-sans text-[#2f261f] dark:text-white/85 leading-relaxed">
                    {selectedCase.incident_description ?? 'No description provided.'}
                  </div>

                  <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                        Offers from lawyers
                      </div>
                    </div>

                    {offersError && (
                      <div className="mt-2 text-sm font-sans text-red-500">
                        {offersError}
                      </div>
                    )}

                    {offersLoading ? (
                      <div className="mt-3 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                        Loading offers…
                      </div>
                    ) : offers.length === 0 ? (
                      <div className="mt-3 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                        No offers yet.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {offers.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-lg border border-[#e7d9c7] dark:border-[#cdaa80]/20 px-3 py-2 bg-[#fdf9f3] dark:bg-[#12284f]/70"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-sans text-[#2f261f] dark:text-white/85 font-medium">
                                  {typeof o.offer_amount === 'number' ? `₹${o.offer_amount.toLocaleString('en-IN')}` : 'Offer received'}
                                </div>
                                {(() => {
                                  const offerText = (o as { offer_message?: string; offer_note?: string }).offer_message ?? o.offer_note
                                  if (!offerText) return null
                                  return (
                                    <div className="mt-1 text-[12px] font-sans text-[#5b4b3d] dark:text-white/70 break-words">
                                      {offerText}
                                    </div>
                                  )
                                })()}
                                <div className="mt-1 text-[11px] font-sans text-[#5b4b3d] dark:text-white/60">
                                  {o.offer_sent_at ? new Date(o.offer_sent_at).toLocaleString('en-IN') : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => { void handleAcceptOffer(o.id) }}
                                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-sans border border-[#0f1e3f]/25 bg-[#0f1e3f] text-[#cdaa80] hover:bg-[#0f1e3f]/90 ${acceptingOfferId === o.id ? 'opacity-60 pointer-events-none' : ''}`}
                              >
                                {acceptingOfferId === o.id ? 'Accepting…' : 'Accept'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                        AI case draft (from chatbot)
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#0f1e3f]/60 dark:text-white/60">
                        Case brief
                      </div>
                      <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#e7d9c7] dark:border-[#cdaa80]/20 px-3 py-2 bg-[#fdf9f3] dark:bg-[#12284f]/70 text-[12px] font-sans text-[#2f261f] dark:text-white/85">
                        {selectedCase?.case_brief ? JSON.stringify(selectedCase.case_brief, null, 2) : 'Not available yet.'}
                      </pre>

                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#0f1e3f]/60 dark:text-white/60">
                        Evidence inventory
                      </div>
                      <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#e7d9c7] dark:border-[#cdaa80]/20 px-3 py-2 bg-[#fdf9f3] dark:bg-[#12284f]/70 text-[12px] font-sans text-[#2f261f] dark:text-white/85">
                        {selectedCase?.evidence_inventory ? JSON.stringify(selectedCase.evidence_inventory, null, 2) : 'Not available yet.'}
                      </pre>

                      <div className="text-[11px] uppercase tracking-wide font-bold text-[#0f1e3f]/60 dark:text-white/60">
                        Recommended strategy
                      </div>
                      <pre className="whitespace-pre-wrap break-words rounded-lg border border-[#e7d9c7] dark:border-[#cdaa80]/20 px-3 py-2 bg-[#fdf9f3] dark:bg-[#12284f]/70 text-[12px] font-sans text-[#2f261f] dark:text-white/85">
                        {selectedCase?.recommended_strategy ? JSON.stringify(selectedCase.recommended_strategy, null, 2) : 'Not available yet.'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <style dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3eadf;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(153,121,83,0.35);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(153,121,83,0.55);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f1e3f;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #213a56;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(205,170,128,0.5);
        }
      `}} />

      </div>
    </div>
  );
}
