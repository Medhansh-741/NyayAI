'use client';

import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Footer } from '../../../../components/footer';
import { Sidebar } from '../../../../components/sidebar';

// Example cases data
const INITIAL_CASES = [
  {
    id: 1,
    title: "Security Deposit Not Returned by Landlord",
    description: "Tenant vacated apartment but landlord refused to return ₹50,000 deposit. AI analysis indicates possible tenant protection violation.",
    domain: "Tenant Law",
    date: "Mar 14, 2026",
    status: "Submitted",
    icons: ["home", "gavel"]
  },
  {
    id: 2,
    title: "Employer Withheld Final Salary",
    description: "Employee resigned but employer withheld last salary payment. AI identified potential labour law violation and suggested next steps.",
    domain: "Labour Law",
    date: "Mar 12, 2026",
    status: "Under AI Analysis",
    icons: []
  },
  {
    id: 3,
    title: "Online Payment Fraud",
    description: "Unauthorized UPI transaction detected. AI suggests filing a cybercrime complaint and drafting an FIR.",
    domain: "Cyber Law",
    date: "Mar 10, 2026",
    status: "Drafting Legal Notice",
    icons: []
  },
  {
    id: 4,
    title: "Consumer Complaint Against Electronics Store",
    description: "Customer received defective laptop and was denied refund. AI recommends filing under Consumer Protection Act.",
    domain: "Consumer Law",
    date: "Mar 7, 2026",
    status: "Lawyer Consultation Recommended",
    icons: []
  },
  {
    id: 5,
    title: "Property Dispute Resolution",
    description: "Family property dispute settled through mediation. All parties agreed to the division.",
    domain: "Property Law",
    date: "Mar 1, 2026",
    status: "Case Completed",
    icons: []
  },
  {
    id: 6,
    title: "Breach of Freelance Contract",
    description: "Client refused to pay for completed web development project citing arbitrary quality issues.",
    domain: "Contract Law",
    date: "Feb 24, 2026",
    status: "Drafting Legal Notice",
    icons: []
  },
  {
    id: 7,
    title: "Traffic Violation Misidentification",
    description: "Received e-challan for a vehicle with a similar number plate but different make/model.",
    domain: "Motor Vehicles Act",
    date: "Feb 18, 2026",
    status: "Submitted",
    icons: []
  }
];

export default function CaseHistory() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const cardsWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchIconRef = useRef<SVGSVGElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clickedCardId, setClickedCardId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'title_asc' | 'title_desc'>('latest');

  const sortOptions: Array<{ label: string; value: typeof sortOption }> = [
    { label: 'Latest Case', value: 'latest' },
    { label: 'Oldest Case', value: 'oldest' },
    { label: 'Title A-Z', value: 'title_asc' },
    { label: 'Title Z-A', value: 'title_desc' },
  ];

  // Filter cases based on search query
  const filteredCases = INITIAL_CASES.filter(c =>
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
  const selectedSortIndex = Math.max(0, sortOptions.findIndex((option) => option.value === sortOption));

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.cases-top-nav', { y: -18, opacity: 0, duration: 0.45 })
        .from('.cases-search-sort', { y: 14, opacity: 0, duration: 0.4 }, '-=0.2')
        .from('.case-card', { y: 24, opacity: 0, duration: 0.42, stagger: 0.07 }, '-=0.15');
    },
    { scope: pageRef }
  );

  useGSAP(
    () => {
      gsap.fromTo(
        '.case-card',
        { y: 18, opacity: 0, scale: 0.985 },
        { y: 0, opacity: 1, scale: 1, duration: 0.36, stagger: 0.05, ease: 'power2.out' }
      );
    },
    { scope: cardsWrapperRef, dependencies: [sortOption, searchQuery], revertOnUpdate: true }
  );

  useGSAP(
    () => {
      gsap.from('.search-shell', {
        opacity: 0,
        y: 10,
        scale: 0.985,
        duration: 0.42,
        ease: 'power2.out',
        delay: 0.05
      });
    },
    { scope: pageRef }
  );

  const handleSearchFocus = () => {
    if (!searchContainerRef.current || !searchIconRef.current) return;
    gsap.to(searchContainerRef.current, {
      scale: 1.01,
      boxShadow: '0 0 0 1px rgba(205,170,128,0.65), 0 14px 35px rgba(8,18,40,0.42)',
      duration: 0.22,
      ease: 'power2.out'
    });
    gsap.to(searchIconRef.current, { color: '#cdaa80', scale: 1.08, duration: 0.22, ease: 'power2.out' });
  };

  const handleSearchBlur = () => {
    if (!searchContainerRef.current || !searchIconRef.current) return;
    gsap.to(searchContainerRef.current, {
      scale: 1,
      boxShadow: '0 8px 24px rgba(8,18,40,0.28)',
      duration: 0.22,
      ease: 'power2.out'
    });
    gsap.to(searchIconRef.current, { color: 'rgba(255,255,255,0.4)', scale: 1, duration: 0.22, ease: 'power2.out' });
  };

  return (
    <div ref={pageRef} className="flex min-h-screen bg-[#0f1e3f]">
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-8 text-white flex flex-col pb-24 md:pb-8">

        {/* Top Header/Nav Area */}
        <div className="cases-top-nav flex border-b border-[#213a56] pb-2 mb-6 shrink-0">
          <nav className="flex gap-6 text-sm">
            <button className="text-[#cdaa80] border-b-2 border-[#cdaa80] pb-2 font-medium">Cases</button>
          </nav>
        </div>

        {/* Search and Filters Area */}
        <div className="cases-search-sort space-y-4 mb-6 shrink-0">
          <div ref={searchContainerRef} className="search-shell relative group rounded-full border border-[#2b4b6b] bg-[#12284f]/85 shadow-[0_8px_24px_rgba(8,18,40,0.28)] overflow-hidden">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg ref={searchIconRef} className="h-4 w-4 text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-transparent border-none rounded-full pl-11 pr-4 py-3 text-sm outline-none text-white placeholder-white/40"
              placeholder="Search your legal cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="ml-auto w-full md:w-[560px]">
              <span className="mb-2 block text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cdaa80]/70">
                Sort Cases
              </span>
              <div className="relative h-16 bg-[#0a152e] shrink-0 flex items-center justify-center overflow-hidden rounded-full border border-[#cdaa80]/20 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),_0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="absolute left-0 w-24 h-full bg-gradient-to-r from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-l-full" />
                <div className="absolute right-0 w-24 h-full bg-gradient-to-l from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-r-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[132px] h-[46px] bg-[#cdaa80]/15 border border-[#cdaa80]/70 rounded-full z-10 pointer-events-none shadow-[0_0_20px_rgba(205,170,128,0.3)]" />
                <div
                  className="absolute top-1/2 left-1/2 flex items-center transition-transform duration-500 ease-out z-10"
                  style={{ transform: `translate(calc(-${selectedSortIndex * 132 + 66}px), -50%)` }}
                >
                  {sortOptions.map((option, idx) => {
                    const dist = Math.abs(idx - selectedSortIndex);
                    const isSelected = dist === 0;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSortOption(option.value)}
                        className={`w-[132px] shrink-0 text-center cursor-pointer transition-all duration-300 tracking-wide text-[14px] font-semibold ${isSelected ? 'text-[#cdaa80] drop-shadow-[0_0_12px_rgba(205,170,128,1)]' : 'text-[#cdaa80]/50 hover:text-[#cdaa80]/80'}`}
                        style={{
                          transform: `scale(${isSelected ? 1.03 : Math.max(0.78, 1 - dist * 0.15)})`,
                          opacity: isSelected ? 1 : Math.max(0.2, 1 - dist * 0.25),
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Cases List - Updated with Yellow Card Theme */}
        <div ref={cardsWrapperRef} className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {sortedCases.map((c) => (
            <div
              key={c.id}
              onClick={() => setClickedCardId(c.id)}
              onAnimationEnd={() => setClickedCardId(null)}
              className={`
              case-card bg-[#d9c5a0] rounded-lg p-6 border border-transparent 
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
                  ${c.status === 'Submitted' ? 'bg-[#0f1e3f] text-white border-transparent' :
                      c.status === 'Case Completed' ? 'bg-[#0f1e3f]/20 text-[#0f1e3f] border-[#0f1e3f]/10' :
                        'bg-transparent text-[#0f1e3f] border-[#0f1e3f]/30'}
                `}>
                    {c.status}
                  </span>
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

                <div className="flex items-center gap-1 text-[#0f1e3f] font-bold text-sm hover:underline">
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}

          {filteredCases.length === 0 && (
            <div className="text-center py-12 text-white/50">
              No cases found matching your search.
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #213a56;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #cdaa80;
        }
      `}} />

        <Footer
          themeColors={{
            bgLight: '#0f1e3f',
            bgDark: '#0f1e3f',
            cardBgLight: '#0f1e3f',
            cardBgDark: '#0f1e3f',
            textLight: '#ffffff',
            textDark: '#cdaa80',
            accent: '#cdaa80',
            accentHover: '#997953',
          }}
          logoText="NyayAI"
          copyrightText="© 2026 NyayAI. All rights reserved."
        />
      </div>
    </div>
  );
}
