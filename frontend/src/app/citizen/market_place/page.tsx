'use client';

import React, { useState } from 'react';

// Mock data for lawyers
const LAWYERS = [
  {
    id: 1,
    name: "Adv. Rohan Mehta",
    specialty: "Property & Tenant Law",
    description: "Specializes in landlord-tenant disputes, property possession cases, and eviction matters. 10+ years of experience practicing in Delhi District Courts and High Court. Offers legal notice drafting and court representation.",
    category: "CIVIL LAW",
    priceRange: "₹5,000 - ₹12,000",
    responseTime: "Responds within 24 hours",
    verified: true
  },
  {
    id: 2,
    name: "Adv. Priya Sharma",
    specialty: "Consumer & Cyber Law",
    description: "Expert in consumer protection disputes, online fraud cases, and cybercrime complaints. Assists with FIR drafting, legal notices, and representation before consumer courts.",
    category: "COMMERCIAL LAW",
    priceRange: "₹8,000 consultation",
    responseTime: "Within 12 hours",
    verified: true
  },
  {
    id: 3,
    name: "Adv. Arjun Varma",
    specialty: "Criminal Defense",
    description: "Specialized in bail hearings, criminal appeals, and white-collar defense. Former public prosecutor with extensive trial experience in sessions courts.",
    category: "CRIMINAL LAW",
    priceRange: "₹10,000 - ₹25,000",
    responseTime: "Within 24 hours",
    verified: true
  }
];

export default function LawyerMarketplace() {
  const [activePriceFilter, setActivePriceFilter] = useState<string>('10k-25k');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10 text-white min-h-screen bg-[#0f1e3f] font-serif">
      
      {/* Header Section */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-medium tracking-wide text-[#cdaa80] mb-2 font-serif">
          Lawyer Marketplace
        </h1>
        <p className="text-white/70 text-[15px] font-sans">
          Browse verified lawyers matched to your legal case and consult them directly.
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap gap-4 mb-8 font-sans">
        {/* Law Type Dropdown */}
        <button className="flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg hover:bg-[#213a56] transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-48">
          <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="flex-1 text-left text-sm">Law Type</span>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Price Range Toggle Group */}
        <div className="flex bg-[#0f1e3f] border border-[#cdaa80]/50 rounded-lg overflow-hidden shrink-0">
          <button 
            onClick={() => setActivePriceFilter('under10k')}
            className={`px-5 py-2.5 text-sm transition-all duration-200 border-r border-[#cdaa80]/30 text-center
              ${activePriceFilter === 'under10k' ? 'bg-[#cdaa80] text-[#0f1e3f] font-medium' : 'text-[#cdaa80] hover:bg-[#213a56]'}
            `}
          >
            &lt; ₹10k
          </button>
          <button 
            onClick={() => setActivePriceFilter('10k-25k')}
            className={`px-5 py-2.5 text-sm transition-all duration-200 border-r border-[#cdaa80]/30 text-center
              ${activePriceFilter === '10k-25k' ? 'bg-[#cdaa80] text-[#0f1e3f] font-medium' : 'text-[#cdaa80] hover:bg-[#213a56]'}
            `}
          >
            ₹10k - ₹25k
          </button>
          <button 
            onClick={() => setActivePriceFilter('over25k')}
            className={`px-5 py-2.5 text-sm transition-all duration-200 text-center
              ${activePriceFilter === 'over25k' ? 'bg-[#cdaa80] text-[#0f1e3f] font-medium' : 'text-[#cdaa80] hover:bg-[#213a56]'}
            `}
          >
            &gt; ₹25k
          </button>
        </div>

        {/* Experience Dropdown */}
        <button className="flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg hover:bg-[#213a56] transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-56">
          <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="flex-1 text-left text-sm">Years in Practice</span>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Lawyers List */}
      <div className="space-y-6">
        {LAWYERS.map((lawyer) => (
          <div 
            key={lawyer.id}
            onMouseEnter={() => setHoveredCard(lawyer.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-6 md:p-8 
              transition-all duration-300 ease-out cursor-pointer relative overflow-hidden shadow-lg
              ${hoveredCard === lawyer.id ? 'transform -translate-y-1 shadow-2xl brightness-105' : ''}
            `}
          >
            {/* Subtle background texture/pattern effect for the card */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f1e3f 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 transition-transform duration-300">
              
              {/* Left Content Area */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start gap-4">
                     <span className="inline-block px-1.5 py-0.5 bg-[#0f1e3f]/10 rounded text-[10px] font-bold tracking-wider font-sans text-[#0f1e3f]/70 uppercase">
                      {lawyer.category}
                    </span>
                    <div className="md:hidden text-right font-sans mb-2">
                       <div className="text-lg font-bold font-serif">{lawyer.priceRange}</div>
                    </div>
                </div>
                
                <h2 className="text-xl md:text-2xl font-medium tracking-tight">
                  <span className="font-semibold">{lawyer.name.split('—')[0]}</span> 
                  {lawyer.name.includes('—') ? lawyer.name.substring(lawyer.name.indexOf('—')) : ` — ${lawyer.specialty}`}
                </h2>
                
                <p className="text-[#0f1e3f]/80 text-[14px] leading-relaxed font-sans max-w-4xl pr-4">
                  {lawyer.description}
                </p>
                
                {/* Footer of card */}
                <div className="pt-4 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-2">
                    {lawyer.verified && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[#0f1e3f]/90">
                        <div className="bg-[#0f1e3f]/20 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px]">
                          A
                        </div>
                        Verified Advocate
                      </div>
                    )}
                  </div>
                   <button 
                    className={`
                      md:hidden
                      px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans
                      transition-all duration-300
                      ${hoveredCard === lawyer.id ? 'bg-[#0f1e3f] text-[#cdaa80] border-[#0f1e3f]' : 'hover:bg-[#0f1e3f]/5'}
                    `}
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Right Content Area (Pricing & CTA) */}
              <div className="hidden md:flex flex-col items-end justify-between shrink-0 pl-6 border-l border-[#0f1e3f]/10">
                <div className="text-right font-sans">
                  <div className="text-[17px] font-bold font-serif mb-1">{lawyer.priceRange}</div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-[#0f1e3f]/70 whitespace-nowrap">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lawyer.responseTime}
                  </div>
                </div>
                
                <button 
                  className={`
                    px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans
                    transition-all duration-300 mt-4
                    ${hoveredCard === lawyer.id ? 'bg-[#0f1e3f] text-[#cdaa80] border-[#0f1e3f]' : 'hover:bg-[#0f1e3f]/5'}
                  `}
                >
                  View Profile
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
