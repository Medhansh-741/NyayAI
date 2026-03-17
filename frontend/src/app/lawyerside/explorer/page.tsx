'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import gsap from 'gsap';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../../types/supabase';
import { Menu, Home, Compass, Store, Briefcase } from 'lucide-react';

import { useGSAP } from '@gsap/react';

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'explorer', icon: Compass, label: 'Explorer', href: '/lawyerside/explorer' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'yourcases', icon: Briefcase, label: 'Your Cases', href: '/lawyerside/yourcases' },
];

export default function LawyerLegalRightsExplorer() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const domainsHeaderRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const featuredHeaderRef = useRef<HTMLHeadingElement>(null);
  const featuredCardRef = useRef<HTMLDivElement>(null);

  const [activeLang, setActiveLang] = useState('ENGLISH');

  const handleProfileClick = () => {
    router.push('/lawyerside/profile');
  };
  const [featuredCase, setFeaturedCase] = useState<Database['public']['Tables']['cases']['Row'] | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchFeaturedTopic = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .not('confidence_score', 'is', null)
          .order('confidence_score', { ascending: false })
          .limit(1)
          .single();
          
        if (data && !error) {
          setFeaturedCase(data);
        }
      } catch (err) {
        console.error("Error fetching featured topic:", err);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedTopic();
  }, [supabase]);

  const domains = [
    {
      title: "Property & Tenant",
      desc: "leases, evictions, deposit disputes",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
        </svg>
      )
    },
    {
      title: "Consumer Protection",
      desc: "unfair trade practices, quality claims",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Criminal Law",
      desc: "BNS, arrest, bail procedure",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      )
    },
    {
      title: "Cyber Security",
      desc: "identity theft, data breaches",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "Family Law",
      desc: "divorce, maintenance, custody",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      )
    },
    {
      title: "Labour Rights",
      desc: "wages, termination, disputes",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "RTI",
      desc: "Right to Information access",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Corruption",
      desc: "reporting public office misuse",
      icon: (
        <div className="relative">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-[#0f1e3f]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 font-bold text-white text-[10px] md:text-sm">₹</div>
        </div>
      )
    }
  ];

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.fromTo(titleRef.current, 
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo(searchBarRef.current, 
      { opacity: 0, y: -20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, 
      "-=0.4"
    )
    .fromTo(domainsHeaderRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, 
      "-=0.2"
    )
    .fromTo(".domain-card", 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'back.out(1.2)', clearProps: "all" }, 
      "-=0.3"
    )
    .fromTo(featuredHeaderRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, 
      "-=0.2"
    )
    .fromTo(featuredCardRef.current, 
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', clearProps: "all" }, 
      "-=0.3"
    );

  }, { scope: containerRef });

  return (
    <div className="flex bg-gray-50 dark:bg-[#0f1e3f] font-sans h-screen overflow-hidden text-gray-900 dark:text-white transition-colors duration-300" ref={containerRef}>
      {/* Sidebar Navigation */}
      <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full w-full overflow-y-auto custom-scrollbar">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#997953]/[0.08] dark:bg-white/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#997953]/[0.12] dark:bg-[#cdaa80]/[0.05] rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-[1400px] mx-auto px-6 py-10 md:py-12 z-10 flex flex-col flex-1">
          
          {/* Title */}
          <h1 ref={titleRef} className="pt-4 md:pt-8 text-3xl md:text-4xl lg:text-[46px] font-serif font-bold text-[#997953] dark:text-[#cdaa80] text-center mb-10 tracking-widest drop-shadow-md">
            LEGAL RIGHTS EXPLORER
          </h1>

        {/* Search Bar */}
        <div ref={searchBarRef} className="relative w-full max-w-5xl mx-auto mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#997953]/20 to-[#997953]/5 dark:from-[#cdaa80]/20 dark:to-[#cdaa80]/5 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative flex items-center bg-white dark:bg-[#0f1e3f] border border-[#d8c1a1] dark:border-[#cdaa80]/40 rounded-full overflow-hidden transition-all duration-300 focus-within:border-[#997953] dark:focus-within:border-[#cdaa80] focus-within:ring-1 focus-within:ring-[#997953]/40 dark:focus-within:ring-[#cdaa80]/50">
            <input 
              type="text" 
              placeholder="Search by keyword (e.g., Eviction), Section (e.g., BNS 103), or legal issue..."
              className="flex-1 bg-transparent px-6 py-3 md:py-4 text-[#443831] dark:text-white placeholder-[#443831]/40 dark:placeholder-white/50 outline-none text-[15px] md:text-base w-full"
            />
            
            {/* Language Toggles */}
            <div className="flex items-center px-4 gap-3 bg-[#997953]/10 dark:bg-[#cdaa80]/10 h-full py-3 md:py-4 border-l border-[#997953]/20 dark:border-[#cdaa80]/20">
              {['ENGLISH', 'हिन्दी', 'HINGLISH'].map((lang) => (
                <button 
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`text-[11px] md:text-sm font-medium tracking-wide transition-colors ${activeLang === lang ? 'text-[#997953] dark:text-[#cdaa80]' : 'text-[#443831]/60 hover:text-[#443831]/90 dark:text-white/60 dark:hover:text-white/90'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Browse by Domains */}
        <div className="w-full mb-10">
          <h2 ref={domainsHeaderRef} className="text-[#5b4b3d] dark:text-[#cdaa80] text-[15px] md:text-[17px] font-semibold tracking-wide mb-5 uppercase flex items-center gap-2">
            BROWSE BY LEGAL DOMAINS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" ref={cardsRef}>
            {domains.map((domain) => (
              <div 
                key={domain.title} 
                className="domain-card bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-5 md:p-6 flex flex-col justify-between items-start cursor-pointer border border-[#e3d4bf] dark:border-transparent hover:bg-[#f9f4ec] dark:hover:bg-[#d9b88f] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(225,193,138,0.15)] transition-all duration-300 min-h-[160px]"
              >
                <div className="flex gap-4 items-start w-full">
                  <div className="shrink-0">
                    {domain.icon}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-serif font-medium leading-tight mb-1">{domain.title}</h3>
                    <p className="text-[#0f1e3f]/70 text-xs md:text-[13px] leading-tight font-sans">{domain.desc}</p>
                  </div>
                </div>
                
                <button className="mt-4 px-4 py-1.5 border border-[#0f1e3f]/40 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase hover:bg-[#0f1e3f] hover:text-[#cdaa80] hover:border-[#0f1e3f] transition-colors duration-300">
                  EXPLORE TOPIC
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Topic */}
        <div className="w-full mt-auto pt-6">
          <h2 ref={featuredHeaderRef} className="text-[#5b4b3d] dark:text-[#cdaa80] text-[15px] md:text-[17px] font-semibold tracking-wide mb-4 uppercase">
            {loadingFeatured 
              ? "LOADING FEATURED TOPIC..." 
              : featuredCase 
                ? "FEATURED TOPIC: CITIZEN CASE MATCH" 
                : "FEATURED TOPIC: BNS vs IPC - The 2023 Law Overhaul"}
          </h2>
          
          <div ref={featuredCardRef} className="bg-white dark:bg-[#cdaa80] rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-8 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-[0_8px_32px_rgba(225,193,138,0.1)] transition-all duration-300 relative overflow-hidden group border border-[#e3d4bf] dark:border-transparent">
            {/* Subtle highlight effect */}
            <div className="absolute inset-0 bg-[#997953]/0 group-hover:bg-[#997953]/5 dark:bg-white/0 dark:group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>

            {loadingFeatured ? (
              <div className="flex-1 w-full animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-[#0f1e3f]/10 rounded-full w-32"></div>
                <div className="h-8 bg-[#0f1e3f]/10 rounded w-3/4"></div>
                <div className="space-y-2 mt-2">
                  <div className="h-4 bg-[#0f1e3f]/10 rounded w-full"></div>
                  <div className="h-4 bg-[#0f1e3f]/10 rounded w-5/6"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Left side: Content */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="mb-4">
                    <span className="inline-block bg-[#0f1e3f] text-[#cdaa80] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase shadow-sm">
                      {featuredCase ? featuredCase.domain : "CRIMINAL LAW"}
                    </span>
                  </div>
                  
                  <h3 className="text-xl md:text-[26px] font-serif font-bold text-[#0f1e3f] flex items-center flex-wrap gap-3 mb-3 leading-tight">
                    {featuredCase ? (featuredCase.title || "Pending Case Title") : "BNS Section 103: Penalty for Murder"}
                    {!featuredCase && (
                      <span className="border border-[#0f1e3f]/60 text-[#0f1e3f]/90 text-[11px] md:text-sm px-3 py-0.5 rounded-full font-sans font-medium whitespace-nowrap tracking-wide">
                        Replaces IPC 302
                      </span>
                    )}
                  </h3>
                  
                  <p className="text-[#0f1e3f]/90 text-sm md:text-base font-sans leading-relaxed max-w-4xl line-clamp-3">
                    {featuredCase 
                      ? (featuredCase.incident_description || "Description pending review.") 
                      : "This section details the definition and punishment for murder, specifying death or life imprisonment. Crucially, it replaces the well-known IPC Section 302."}
                  </p>
                </div>
                
                {/* Right side: Actions */}
                <div className="flex flex-col items-start md:items-end w-full md:w-[280px] shrink-0 gap-3">
                  <div className="text-[#0f1e3f] text-sm md:text-[15px] mb-1">
                    Confidence Score: <span className="font-bold text-base">
                      {featuredCase?.confidence_score ? `${(featuredCase.confidence_score * 100).toFixed(0)}%` : "99%"}
                    </span>
                  </div>
                  <button className="w-full px-6 py-2.5 border border-[#0f1e3f] rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-[#0f1e3f] hover:text-[#cdaa80] transition-all duration-300 shadow-sm">
                    {featuredCase ? "VIEW FULL BRIEF" : "FIND A LAWYER FOR THIS"}
                  </button>
                  <button className="w-full px-6 py-2.5 border border-[#0f1e3f] rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-[#0f1e3f] hover:text-[#cdaa80] transition-all duration-300 shadow-sm">
                    {featuredCase ? "MATCH AS LAWYER" : "REQUEST DOCUMENT DRAFT"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>

      </div>
      
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
  );
}
