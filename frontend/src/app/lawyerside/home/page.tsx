'use client';
import React, { useEffect, useRef, useState } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import gsap from 'gsap';
import { Menu, Home, Store, Gavel, X } from 'lucide-react';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '')
import { useGSAP } from '@gsap/react';
import * as Dialog from '@radix-ui/react-dialog';

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'my-cases', icon: Gavel, label: 'My Cases', href: '/lawyerside/my-cases' },
];

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
  const inputBarRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeLang, setActiveLang] = useState('ENGLISH');

  const {
    isRecording,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording
  } = useVoiceRecorder();

  useEffect(() => {
    if (recorderError) {
      toast.error(recorderError);
      resetRecording();
    }
  }, [recorderError, resetRecording]);

  useEffect(() => {
    if (audioBlob) {
      handleTranscription(audioBlob);
    }
  }, [audioBlob]);

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    resetRecording();

    try {
      const formData = new FormData();
      formData.append('file', blob, 'voice_recording.webm');

      const transcribeUrl = `${BACKEND_URL}/transcribe`;
      
      const response = await axios.post(transcribeUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.text) {
        setInput(prev => prev ? `${prev} ${response.data.text}` : response.data.text);
      } else {
        toast.error("Could not transcribe audio. Please try again.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Failed to process voice input. Please ensure backend is running.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleProfileClick = () => {
    router.push('/lawyerside/profile');
  };

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

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
      } catch (error) {
        if (!cancelled) {
          setTopics([]);
          setTopicsError('Unable to load legal sections right now. Please try again.');
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
  }, [BACKEND_URL, selectedDomain]);

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
      } catch (_error) {
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
  }, [BACKEND_URL]);

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden" ref={containerRef}>
      {/* Sidebar Navigation */}
      <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full w-full overflow-y-auto custom-scrollbar">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#997953]/[0.08] dark:bg-white/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#997953]/[0.12] dark:bg-[#cdaa80]/[0.05] rounded-full blur-[80px] pointer-events-none"></div>

        {/* Top Right Icons */}
        <div ref={iconsRef} className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-4 z-10 cursor-pointer">
          <button className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full border border-gray-300 dark:border-white/5 dark:bg-[#213a56]/20 bg-white text-gray-700 dark:text-[#cdaa80] hover:bg-gray-100 dark:hover:bg-[#213a56]/60 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm">
            <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
          <button className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full border border-gray-300 dark:border-white/5 dark:bg-[#213a56]/20 bg-white text-gray-700 dark:text-[#cdaa80] hover:bg-gray-100 dark:hover:bg-[#213a56]/60 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm">
            <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
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
          </div>
        </div>

        {/* Fixed Input Area at Bottom */}
        <div ref={inputBarRef} className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0f1e3f] dark:via-[#0f1e3f] dark:to-transparent z-20">
          <div className="max-w-4xl mx-auto md:px-6">
            <div className="flex items-center gap-4 w-full group relative">
              
              {/* Plus Button */}
              <button 
                type="button"
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border border-gray-300 dark:border-white/10 dark:bg-transparent bg-white text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 active:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer shadow-sm z-10 outline-none focus:ring-2 focus:ring-[#997953]/50 dark:focus:ring-white/20"
                aria-label="Add attachment"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              {/* Input Field */}
              <div className="flex-1 relative cursor-text transition-transform duration-300">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTranscribing}
                  placeholder={isTranscribing ? "Processing voice input..." : "Describe your legal query..."}
                  className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#cdaa80]/30 rounded-full pl-6 pr-16 py-4 md:py-[18px] text-[15px] outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:border-[#997953] dark:focus:border-[#cdaa80] focus:ring-1 focus:ring-[#997953] dark:focus:ring-[#cdaa80] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-gray-400 dark:hover:border-[#cdaa80]/60 hover:bg-white/50 dark:hover:bg-[#213a56]/20 focus:bg-white dark:focus:bg-[#1a2c47]/50 disabled:opacity-70 disabled:cursor-wait"
                />
                
                {/* Voice Input Button Inside the Input Field */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-wait ${
                    isTranscribing 
                      ? 'bg-transparent text-[#997953] dark:text-[#cdaa80]' // loader state
                      : isRecording 
                        ? 'bg-red-500 text-white animate-pulse-ring' // recording state
                        : 'bg-transparent text-gray-400 hover:text-[#997953] dark:text-white/40 dark:hover:text-[#cdaa80] hover:bg-gray-100 dark:hover:bg-white/5' // idle state
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isTranscribing ? (
                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isRecording ? 2 : 1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

            {/* Right Column: Recent Legal Updates (Self-stretching with internal scroll) */}
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col h-full min-h-0">
              <div className="bg-white dark:bg-[#0f1e3f]/40 border border-[#d8c1a1] dark:border-[#cdaa80]/20 rounded-xl flex flex-col overflow-hidden flex-1 h-full min-h-0">
                {/* Header now inside the panel for better vertical alignment */}
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
