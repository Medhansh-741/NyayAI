'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import gsap from 'gsap';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { getBackendUrl } from '@/lib/utils/backendUrl';
import { Menu, Home, Store, Gavel, X } from 'lucide-react';

const BACKEND_URL = getBackendUrl()
import { useGSAP } from '@gsap/react';
import * as Dialog from '@radix-ui/react-dialog';

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'my-cases', icon: Gavel, label: 'My Cases', href: '/lawyerside/my-cases' },
];

const getReadStorageKey = (lawyerId: string) => `lawyer_home_read_notifications:${lawyerId}`;

const readIdsFromStorage = (lawyerId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(getReadStorageKey(lawyerId));
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

const writeReadIdsToStorage = (lawyerId: string, ids: Set<string>) => {
  localStorage.setItem(getReadStorageKey(lawyerId), JSON.stringify(Array.from(ids)));
};

const formatRelativeTime = (iso: string | null) => {
  if (!iso) return 'Just now';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

type BriefDispatchRow = {
  id: string
  case_id: string
  citizen_id: string
  lawyer_id: string
  intro_message: string
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
      }
    }
  }
}

type NotificationRow = Database['public']['Tables']['notifications']['Row']

type LawyerBellNotification = {
  id: string
  caseId: string | null
  title: string
  body: string
  createdAt: string | null
  isRead: boolean
  kind: 'dispatch' | 'system'
}

export default function LawyerHome() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const domainsHeaderRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [topics, setTopics] = useState<DomainTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [legalUpdates, setLegalUpdates] = useState<LegalUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [updatesError, setUpdatesError] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState<LawyerBellNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const handleProfileClick = () => {
    router.push('/lawyerside/profile');
  };

  const loadLawyerNotifications = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return;
    const lawyerId = authData.user.id;

    setNotificationLoading(true);

    const { data: dispatchRows, error: dispatchErr } = await (supabase as unknown as BriefDispatchClient)
      .from('brief_dispatches')
      .select('id, case_id, citizen_id, intro_message, status, created_at')
      .eq('lawyer_id', lawyerId)
      .in('status', ['sent', 'offered'])
      .order('created_at', { ascending: false });

    if (dispatchErr) {
      setNotificationLoading(false);
      return;
    }

    const rows = dispatchRows ?? [];
    const caseIds = rows.map((row) => row.case_id);

    const { data: notificationRows } = await supabase
      .from('notifications')
      .select('id, title, body, data, created_at, is_read, type')
      .eq('user_id', lawyerId)
      .in('type', ['offer_accepted', 'offer_received'])
      .order('created_at', { ascending: false })
      .limit(30);

    (notificationRows ?? []).forEach((row) => {
      const maybeCaseId = (row.data as Record<string, unknown> | null)?.case_id;
      if (typeof maybeCaseId === 'string') {
        caseIds.push(maybeCaseId);
      }
    });

    const { data: caseRows } = await supabase
      .from('cases')
      .select('id, title')
      .in('id', Array.from(new Set(caseIds)));

    const titleByCaseId = new Map((caseRows ?? []).map((row) => [row.id, row.title ?? 'your case']));
    const readIds = readIdsFromStorage(lawyerId);

    const dispatchMapped: LawyerBellNotification[] = rows.map((row) => ({
      id: `dispatch:${row.id}`,
      caseId: row.case_id,
      title: 'New citizen request received',
      body: row.intro_message || `A citizen sent a request for ${titleByCaseId.get(row.case_id) ?? 'a case'}.`,
      createdAt: row.created_at,
      isRead: readIds.has(`dispatch:${row.id}`),
      kind: 'dispatch',
    }));

    const systemMapped: LawyerBellNotification[] = (notificationRows as NotificationRow[] | null ?? []).map((row) => {
      const maybeData = row.data as Record<string, unknown> | null;
      const caseId = typeof maybeData?.case_id === 'string' ? maybeData.case_id : null;
      const fallbackTitle = caseId ? titleByCaseId.get(caseId) : null;
      const body = row.body || (fallbackTitle ? `${fallbackTitle} has a case update.` : 'You have a new case update.');

      return {
        id: `notification:${row.id}`,
        caseId,
        title: row.title || 'Case update',
        body,
        createdAt: row.created_at,
        isRead: row.is_read || readIds.has(`notification:${row.id}`),
        kind: 'system',
      };
    });

    const mapped = [...dispatchMapped, ...systemMapped].sort((a, b) => {
      const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTs - aTs;
    });

    setNotifications(mapped);
    setUnreadNotificationCount(mapped.filter((item) => !item.isRead).length);
    setNotificationLoading(false);
  }, []);

  const handleMarkAllRead = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return;
    const lawyerId = authData.user.id;
    const nextRead = new Set(notifications.map((item) => item.id));
    writeReadIdsToStorage(lawyerId, nextRead);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotificationCount(0);
  };

  const handleNotificationClick = async (item: LawyerBellNotification) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authError && authData.user) {
      const lawyerId = authData.user.id;
      const nextRead = readIdsFromStorage(lawyerId);
      nextRead.add(item.id);
      writeReadIdsToStorage(lawyerId, nextRead);
    }
    setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
    setUnreadNotificationCount((prev) => Math.max(prev - (item.isRead ? 0 : 1), 0));
    setNotificationOpen(false);
    router.push(item.kind === 'system' ? '/lawyerside/my-cases' : '/lawyerside/marketplace');
  };

  const domains = [
    {
      title: "Criminal",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      desc: "Offences and criminal procedure"
    },
    {
      title: "Civil Procedure",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      desc: "Civil suits and court processes"
    },
    {
      title: "Property",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      desc: "Property ownership and tenancy disputes"
    },
    {
      title: "Family",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      desc: "Marriage divorce and custody matters"
    },
    {
      title: "Consumer",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      desc: "Defective products and service complaints"
    },
    {
      title: "Labour",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      ),
      desc: "Workplace rights and employment disputes"
    },
    {
      title: "Contract",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      desc: "Agreements and breach of contract"
    },
    {
      title: "Corporate",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      desc: "Company governance and compliance"
    },
    {
      title: "Cyber Law",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      desc: "Online fraud and digital offences"
    },
    {
      title: "Data Privacy",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      desc: "Protection of personal data"
    },
    {
      title: "Banking",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
      desc: "Loan disputes and financial recovery"
    },
    {
      title: "RTI",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      desc: "Access to government information"
    },
    {
      title: "Constitutional",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
      desc: "Fundamental rights and writ petitions"
    },
    {
      title: "PIL",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      desc: "Cases filed for public welfare"
    },
    {
      title: "Corruption",
      icon: (
        <div className="relative">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 font-bold text-white text-[10px] md:text-[11px]">₹</div>
        </div>
      ),
      desc: "Misuse of public office"
    },
    {
      title: "Administrative",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      desc: "Government decisions and regulation"
    }
  ];

  useEffect(() => {
    if (!selectedDomain) {
      setTopics([]);
      setTopicsError(null);
      return;
    }

    let cancelled = false;
    const fetchTopics = async () => {
      setLoadingTopics(true);
      setTopicsError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/legal/domain-topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: selectedDomain, per_topic_limit: 6 }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: DomainTopicsResponse = await response.json();
        if (!cancelled) {
          setTopics(data.topics || []);
        }
      } catch {
        if (!cancelled) {
          const fallback = FALLBACK_TOPICS_BY_DOMAIN[selectedDomain as keyof typeof FALLBACK_TOPICS_BY_DOMAIN] || [];
          if (fallback.length > 0) {
            setTopics(fallback);
            setTopicsError(null);
          } else {
            setTopics([]);
            setTopicsError('Unable to load legal sections right now. Please try again.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingTopics(false);
        }
      }
    };

    fetchTopics();
    return () => {
      cancelled = true;
    };
  }, [selectedDomain]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchLegalUpdates = async () => {
      setLoadingUpdates(true);
      setUpdatesError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/explorer/legal-updates?limit=8`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: LegalUpdatesResponse = await response.json();
        if (!cancelled) {
          const nextUpdates = (data.updates || []).slice(0, 10);
          setLegalUpdates(nextUpdates.length ? nextUpdates : FALLBACK_LEGAL_UPDATES.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          setLegalUpdates(FALLBACK_LEGAL_UPDATES.slice(0, 8));
          setUpdatesError('Showing curated legal updates.');
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoadingUpdates(false);
        }
      }
    };

    fetchLegalUpdates();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(iconsRef.current, {
      opacity: 0,
      y: -15,
      duration: 0.6,
      ease: 'power3.out'
    })
    .fromTo(titleRef.current, 
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      "-=0.4"
    )
    .fromTo(domainsHeaderRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, 
      "-=0.2"
    )
    .fromTo(".domain-card", 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, ease: 'back.out(1.2)', clearProps: "all" }, 
      "-=0.3"
    );

  }, { scope: containerRef });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!notificationRef.current?.contains(target)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  useEffect(() => {
    let liveChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await loadLawyerNotifications();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return;

      liveChannel = supabase
        .channel(`lawyer-home-dispatches:${authData.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'brief_dispatches',
            filter: `lawyer_id=eq.${authData.user.id}`,
          },
          async (payload) => {
            await loadLawyerNotifications();
            if (payload.eventType === 'INSERT') {
              const fresh = payload.new as Record<string, unknown>;
              toast.info('New citizen request received', {
                description: (fresh.intro_message as string) || 'Open marketplace to review and send your offer.',
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${authData.user.id}`,
          },
          async (payload) => {
            const fresh = payload.new as Record<string, unknown>;
            await loadLawyerNotifications();
            if (fresh.type === 'offer_accepted') {
              toast.success('Offer accepted by citizen', {
                description: (fresh.title as string) || 'Your offer was accepted. Open My Cases to continue.',
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'case_pipeline',
            filter: `lawyer_id=eq.${authData.user.id}`,
          },
          async (payload) => {
            const fresh = payload.new as Record<string, unknown>;
            if (fresh.stage === 'withdrawn') {
              toast.info('Offer was closed', {
                description: 'The citizen accepted another offer for this case.',
              });
            }
            if (fresh.stage === 'accepted') {
              toast.success('Case moved to My Cases', {
                description: 'A citizen accepted your offer.',
              });
            }
            await loadLawyerNotifications();
          }
        )
        .subscribe();
    };

    void init();

    return () => {
      if (liveChannel) {
        liveChannel.unsubscribe();
      }
    };
  }, [loadLawyerNotifications]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden" ref={containerRef}>
      {/* Sidebar */}
      <div className="hidden md:block shrink-0 h-screen z-[1000] md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={false} onProfileClick={handleProfileClick} />
      </div>
      <div className="md:hidden relative z-[1000]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={false} onProfileClick={handleProfileClick} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full w-full overflow-y-auto custom-scrollbar">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#997953]/[0.08] dark:bg-white/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#997953]/[0.12] dark:bg-[#cdaa80]/[0.05] rounded-full blur-[80px] pointer-events-none"></div>

        {/* Top Right Icons */}
        <div ref={iconsRef} className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-4 z-[1300] cursor-pointer">
          <div ref={notificationRef} className="relative">
            <button
              title="Notifications"
              onClick={async () => {
                const next = !notificationOpen;
                setNotificationOpen(next);
                if (next) {
                  await loadLawyerNotifications();
                }
              }}
              className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full border border-gray-300 dark:border-white/5 dark:bg-[#213a56]/20 bg-white text-gray-700 dark:text-[#cdaa80] hover:bg-gray-100 dark:hover:bg-[#213a56]/60 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#b0372f] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-[320px] md:w-[360px] rounded-2xl border border-[#d8c1a1]/60 dark:border-[#cdaa80]/20 bg-white/95 dark:bg-[#12284f]/95 backdrop-blur-md shadow-2xl overflow-hidden z-[1200]">
                <div className="px-4 py-3 border-b border-[#e8d7c1] dark:border-[#cdaa80]/20 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] uppercase tracking-[1.5px] text-[#7b5f40] dark:text-[#cdaa80] font-semibold">Notifications</p>
                    <p className="text-[12px] text-[#6b5a49] dark:text-white/70">New citizen requests and offer status updates</p>
                  </div>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#997953] dark:text-[#e0c3a0] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                  {notificationLoading ? (
                    <div className="px-4 py-5 text-sm text-[#6b5a49] dark:text-white/70">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-[#6b5a49] dark:text-white/70">No notifications yet.</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { void handleNotificationClick(item) }}
                        className={`w-full text-left block px-4 py-3 border-b border-[#efe1ce] dark:border-[#cdaa80]/10 hover:bg-[#f9f2e8] dark:hover:bg-[#1a3358] transition-colors ${item.isRead ? 'opacity-80' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-[13px] font-semibold text-[#3f3124] dark:text-white/90 leading-snug">
                              {item.title}
                            </p>
                          </div>
                          <span className="text-[11px] text-[#7b5f40] dark:text-white/60 whitespace-nowrap">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#6b5a49] dark:text-white/75 leading-relaxed line-clamp-2">
                          {item.body}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 bg-[#f8efe2] dark:bg-[#10264a] border-t border-[#e8d7c1] dark:border-[#cdaa80]/20">
                  <button
                    onClick={() => {
                      setNotificationOpen(false);
                      router.push('/lawyerside/marketplace');
                    }}
                    className="text-[12px] font-semibold text-[#997953] dark:text-[#e0c3a0] hover:underline"
                  >
                    View all incoming requests
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 py-4 md:py-5 z-10 flex flex-col flex-1 min-h-0">
          {/* Title */}
          <h1 ref={titleRef} className="pt-2 text-2xl md:text-3xl lg:text-[38px] font-serif font-bold text-[#997953] dark:text-[#cdaa80] text-center mb-6 tracking-widest drop-shadow-md">
            LEGAL RIGHTS EXPLORER
          </h1>

          {/* Main Content Grid Area (Flex-1 to consume exactly the remaining viewport height) */}
          <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            
            {/* Left Column: Legal Domains (Expanding naturally to fill parent) */}
            <div className="flex-1 w-full flex flex-col min-h-0">
              <h2 ref={domainsHeaderRef} className="text-[#5b4b3d] dark:text-[#cdaa80] text-[15px] md:text-[17px] font-semibold tracking-wide mb-5 uppercase flex items-center gap-2 shrink-0">
                BROWSE BY LEGAL DOMAINS
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 flex-1 min-h-0 h-full" ref={cardsRef}>
                {domains.map((domain) => (
                  <div 
                    key={domain.title} 
                    onClick={() => setSelectedDomain(domain.title)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedDomain(domain.title);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="domain-card bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer border border-[#e3d4bf] dark:border-transparent hover:bg-[#f9f4ec] dark:hover:bg-[#d9b88f] hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full w-full group min-h-0"
                  >
                    <div className="shrink-0 transition-transform duration-300 group-hover:scale-110 mb-0.5">
                      <div className="[&>svg]:w-[28px] [&>svg]:h-[28px] md:[&>svg]:w-[32px] md:[&>svg]:h-[32px] [&>div>svg]:w-[28px] [&>div>svg]:h-[28px] md:[&>div>svg]:w-[32px] md:[&>div>svg]:h-[32px]">
                        {domain.icon}
                      </div>
                    </div>
                    <div className="flex flex-col w-full px-1">
                      <h3 className="text-[13px] md:text-[15px] font-serif font-bold leading-tight truncate">{domain.title}</h3>
                      <p className="text-[10px] md:text-[11px] leading-tight text-[#0f1e3f]/75 mt-1 line-clamp-2">
                        {domain.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Recent Legal Updates */}
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col h-full min-h-0">
              <div className="bg-white dark:bg-[#0f1e3f]/40 border border-[#d8c1a1] dark:border-[#cdaa80]/20 rounded-xl flex flex-col overflow-hidden flex-1 h-full min-h-0">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5 shrink-0">
                  <h2 className="text-[#5b4b3d] dark:text-[#cdaa80] text-[14px] md:text-[15px] font-semibold tracking-wide uppercase">
                    RECENT LEGAL UPDATES
                  </h2>
                </div>
                
                <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar flex-1">
                  {loadingUpdates && (
                    <div className="text-[13px] md:text-sm font-medium text-[#443831] dark:text-white/80">
                      Loading latest legal updates...
                    </div>
                  )}

                  {!loadingUpdates && updatesError && (
                    <div className="text-[13px] md:text-sm font-medium text-[#443831] dark:text-white/80">
                      {updatesError}
                    </div>
                  )}

                  {!loadingUpdates && legalUpdates.length === 0 && (
                    <div className="text-[13px] md:text-sm font-medium text-[#443831] dark:text-white/80">
                      No recent legal updates available.
                    </div>
                  )}

                  {!loadingUpdates && legalUpdates.length > 0 && legalUpdates.map((update, index) => (
                    <a
                      key={`${update.link}-${index}`}
                      className="group cursor-pointer block"
                      href={update.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#997953] dark:bg-[#cdaa80] mt-1.5 shrink-0"></div>
                        <div>
                          <h4 className="text-[13px] md:text-sm font-medium text-[#443831] dark:text-white group-hover:text-[#997953] dark:group-hover:text-[#cdaa80] transition-colors leading-snug">
                            {update.title}
                          </h4>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1.5 block">{update.source}</span>
                        </div>
                      </div>
                      {update.short_summary && (
                        <p className="ml-4 mt-1 text-[11px] leading-tight text-[#5b4b3d] dark:text-white/70 line-clamp-1">
                          {update.short_summary}
                        </p>
                      )}
                      {index < legalUpdates.length - 1 && <div className="h-px bg-gray-100 dark:bg-white/5 mt-5"></div>}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <Dialog.Root open={!!selectedDomain} onOpenChange={(open) => { if (!open) setSelectedDomain(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[9999] h-[78vh] max-h-[680px] w-[94vw] max-w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#d8c1a1] bg-white shadow-2xl outline-none dark:border-[#cdaa80]/30 dark:bg-[#0a152e] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between border-b border-[#e9dcc9] px-5 py-4 dark:border-white/10 md:px-6">
              <div>
                <Dialog.Title className="text-lg font-serif font-bold tracking-wide text-[#997953] dark:text-[#cdaa80] md:text-xl">
                  {selectedDomain || 'Domain'}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                  Top relevant legal sections from corpus retrieval
                </Dialog.Description>
              </div>
              <Dialog.Close className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8c1a1] text-[#5b4b3d] transition-colors hover:bg-[#f9f4ec] dark:border-[#cdaa80]/30 dark:text-[#cdaa80] dark:hover:bg-[#12254a]" aria-label="Close legal sections modal">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4 md:px-6 md:pb-6">
              {loadingTopics && (
                <div className="rounded-xl border border-[#e7d9c5] bg-[#fbf7f1] p-4 text-sm font-sans text-[#5b4b3d] dark:border-[#cdaa80]/20 dark:bg-[#12254a]/30 dark:text-white/75">
                  Loading relevant legal sections...
                </div>
              )}

              {!loadingTopics && topicsError && (
                <div className="rounded-xl border border-[#e7d9c5] bg-[#fbf7f1] p-4 text-sm font-sans text-[#5b4b3d] dark:border-[#cdaa80]/20 dark:bg-[#12254a]/30 dark:text-white/75">
                  {topicsError}
                </div>
              )}

              {!loadingTopics && !topicsError && (
                <div className="space-y-4">
                  {topics.length === 0 && (
                    <div className="rounded-xl border border-[#e7d9c5] bg-[#fbf7f1] p-4 text-sm font-sans text-[#5b4b3d] dark:border-[#cdaa80]/20 dark:bg-[#12254a]/30 dark:text-white/75">
                      No relevant sections were found for this domain in the current corpus.
                    </div>
                  )}
                  {topics.map((topic) => (
                    <div key={topic.title} className="rounded-xl border border-[#e7d9c5] bg-[#fffdfa] p-4 dark:border-[#cdaa80]/20 dark:bg-[#12254a]/25">
                      <h3 className="text-[15px] font-sans font-bold text-[#2f261f] dark:text-[#f4e2c8]">
                        {topic.title}
                      </h3>
                      <p className="mt-1 text-sm font-sans leading-relaxed text-[#4a3d33] dark:text-white/80">
                        {topic.explanation}
                      </p>
                      <p className="mt-2 text-[11px] font-sans uppercase tracking-[0.12em] text-[#8a6f4f] dark:text-[#cdaa80]/85">
                        {topic.source_section}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      
      {/* Global CSS for the custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3eadf;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(153,121,83,0.35);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(205, 170, 128, 0.5);
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite;
        }
      `}} />
    </div>
  );
}

type DomainTopic = {
  title: string;
  explanation: string;
  source_section: string;
  score: number | null;
  is_fallback: boolean;
};

type DomainTopicsResponse = {
  domain: string;
  topics: DomainTopic[];
};

type LegalUpdate = {
  title: string;
  short_summary: string;
  source: string;
  link: string;
  published_at: string;
};

type LegalUpdatesResponse = {
  updates: LegalUpdate[];
  mode?: string;
  fetched_at?: string;
};

const FALLBACK_LEGAL_UPDATES: LegalUpdate[] = [
  {
    title: 'Supreme Court reiterates proportionality in administrative decisions',
    short_summary: 'Recent observations emphasize reasoned orders and proportionality in administrative action.',
    source: 'NyayaAI Curated Brief',
    link: 'https://www.sci.gov.in/',
    published_at: '',
  },
  {
    title: 'Consumer redressal timelines highlighted in latest circular',
    short_summary: 'Authorities stressed timely disposal and clear notice standards in consumer disputes.',
    source: 'NyayaAI Curated Brief',
    link: 'https://consumeraffairs.nic.in/',
    published_at: '',
  },
  {
    title: 'Data protection compliance advisories gain focus for digital services',
    short_summary: 'Organizations are advised to strengthen consent handling and incident reporting processes.',
    source: 'NyayaAI Curated Brief',
    link: 'https://www.meity.gov.in/',
    published_at: '',
  },
  {
    title: 'Recent criminal procedure updates stress evidence chain integrity',
    short_summary: 'Legal notes indicate tighter scrutiny on digital evidence handling and record continuity.',
    source: 'NyayaAI Curated Brief',
    link: 'https://www.indiacode.nic.in/',
    published_at: '',
  },
  {
    title: 'Public law brief tracks writ maintainability and alternative remedy',
    short_summary: 'Courts continue balancing writ relief with availability of statutory appeal mechanisms.',
    source: 'NyayaAI Curated Brief',
    link: 'https://www.indiacode.nic.in/',
    published_at: '',
  },
];

const FALLBACK_TOPICS_BY_DOMAIN: Record<string, DomainTopic[]> = {
  "Criminal": [
    {
      title: "BNS Section 103: Murder",
      explanation: "Definition and punishment for murder. Replaces IPC Section 302. Punishment includes death or life imprisonment and fine.",
      source_section: "Bharatiya Nyaya Sanhita, 2023",
      score: 0.99,
      is_fallback: true
    },
    {
      title: "BNS Section 113: Terrorism",
      explanation: "New section defining terrorist acts and prescribing strict punishments for acts threatening India's unity.",
      source_section: "Bharatiya Nyaya Sanhita, 2023",
      score: 0.98,
      is_fallback: true
    },
    {
      title: "BNS Section 303: Theft",
      explanation: "Punishment for theft, defining dishonest takes of movable property from possession.",
      source_section: "Bharatiya Nyaya Sanhita, 2023",
      score: 0.95,
      is_fallback: true
    }
  ],
  "Property": [
    {
      title: "Transfer of Property Act - Section 54",
      explanation: "Defines 'Sale' as a transfer of ownership for a price. Ownership is transferred by registered instrument.",
      source_section: "Transfer of Property Act, 1882",
      score: 0.99,
      is_fallback: true
    },
    {
      title: "Landlord-Tenant: Section 106",
      explanation: "Duration of leases and notice periods required for termination in absence of contract.",
      source_section: "Transfer of Property Act, 1882",
      score: 0.97,
      is_fallback: true
    }
  ],
  "Family": [
    {
      title: "Hindu Marriage Act - Section 13",
      explanation: "Grounds for divorce including adultery, cruelty, desertion, and mutual consent.",
      source_section: "Hindu Marriage Act, 1955",
      score: 0.99,
      is_fallback: true
    },
    {
      title: "Domestic Violence Act - Section 12",
      explanation: "Applications to Magistrate for protection orders, residence orders, and monetary relief.",
      source_section: "P.W.D.V.A., 2005",
      score: 0.98,
      is_fallback: true
    }
  ],
  "Civil Procedure": [
    {
      title: "CPC Section 26: Institution of Suits",
      explanation: "Every suit shall be instituted by the presentation of a plaint or in such other manner as may be prescribed.",
      source_section: "Code of Civil Procedure, 1908",
      score: 0.99,
      is_fallback: true
    },
    {
      title: "CPC Order 39: Temporary Injunctions",
      explanation: "Rules regarding grant of temporary injunctions and interlocutory orders during pending trials.",
      source_section: "Code of Civil Procedure, 1908",
      score: 0.98,
      is_fallback: true
    }
  ]
};
