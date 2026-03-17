'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../../components/sidebar';
import type { NavItem } from '../../../../components/sidebar';
import gsap from 'gsap';
import { Menu, Home, Compass, Store, Gavel } from 'lucide-react';
import { useGSAP } from '@gsap/react';

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
  const searchBarRef = useRef<HTMLDivElement>(null);
  const domainsHeaderRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  const [activeLang, setActiveLang] = useState('ENGLISH');

  const handleProfileClick = () => {
    router.push('/lawyerside/profile');
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
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, ease: 'back.out(1.2)', clearProps: "all" }, 
      "-=0.3"
    );

  }, { scope: containerRef });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden" ref={containerRef}>
      {/* Sidebar */}
      <div className="hidden md:block shrink-0 h-screen z-[1000] md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>
      <div className="md:hidden relative z-[1000]">
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

          {/* Search Bar */}
          <div ref={searchBarRef} className="relative w-full max-w-5xl mx-auto mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#997953]/20 to-[#997953]/5 dark:from-[#cdaa80]/20 dark:to-[#cdaa80]/5 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative flex items-center bg-white dark:bg-[#0f1e3f] border border-[#d8c1a1] dark:border-[#cdaa80]/40 rounded-full overflow-hidden transition-all duration-300 focus-within:border-[#997953] dark:focus-within:border-[#cdaa80] focus-within:ring-1 focus-within:ring-[#997953]/40 dark:focus-within:ring-[#cdaa80]/50">
              <input 
                type="text" 
                placeholder="Search by keyword (e.g., Eviction), Section (e.g., BNS 103), or legal issue..."
                className="flex-1 bg-transparent px-6 py-3 md:py-4 text-[#443831] dark:text-white placeholder-[#443831]/40 dark:placeholder-white/50 outline-none text-[15px] md:text-base w-full"
              />
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
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#997953] dark:bg-[#cdaa80] mt-1.5 shrink-0"></div>
                        <div>
                          <h4 className="text-[13px] md:text-sm font-medium text-[#443831] dark:text-white group-hover:text-[#997953] dark:group-hover:text-[#cdaa80] transition-colors leading-snug">
                            {i === 1 ? "New Amendments in Consumer Protection Act (2024)" : 
                             i === 2 ? "Supreme Court Ruling on Property Inheritance Rights" :
                             i === 3 ? "BNS guidelines updated for digital evidence" :
                             i === 4 ? "Legal Aid Clinics expanded across rural districts" :
                             i === 5 ? "Cyber law updates regarding data privacy" :
                             "Public interest litigation on environmental safety"}
                          </h4>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1.5 block">Placeholder update headline</span>
                        </div>
                      </div>
                      {i < 6 && <div className="h-px bg-gray-100 dark:bg-white/5 mt-5"></div>}
                    </div>
                  ))}
                </div>
              </div>
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
