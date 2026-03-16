'use client';

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Sidebar } from '../../../../components/sidebar';

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
  const [selectedPriceIndex, setSelectedPriceIndex] = useState<number>(2);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const priceOptions = [
    '₹0', '₹10k', '₹20k', '₹30k', '₹40k', '₹50k', '₹60k', '₹70k', '₹80k', '₹90k',
    '₹1L', '₹1.1L', '₹1.2L', '₹1.3L', '₹1.4L', '₹1.5L', '₹1.6L', '₹1.7L', '₹1.8L', '₹1.9L', '₹2L+'
  ];
  
  // Dropdown state
  const [isLawTypeOpen, setIsLawTypeOpen] = useState(false);
  const [selectedLawType, setSelectedLawType] = useState('Law Type');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState('Years in Practice');
  const expDropdownRef = useRef<HTMLDivElement>(null);
  const expDropdownContentRef = useRef<HTMLDivElement>(null);

  const lawTypes = [
    "Criminal",
    "Family / Divorce",
    "Property",
    "Consumer Disputes",
    "Cyber Crime",
    "Labour / Employment",
    "Tax",
    "Corporate / Business",
    "Intellectual Property",
    "Constitutional / PIL"
  ];

  const experienceLevels = [
    "0 – 2 years (Junior Advocate)",
    "3 – 5 years (Early Career)",
    "6 – 10 years (Mid-Level Advocate)",
    "11 – 15 years (Experienced Advocate)",
    "16 – 20 years (Senior Advocate)",
    "20+ years (Highly Experienced)"
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLawTypeOpen(false);
      }
      if (expDropdownRef.current && !expDropdownRef.current.contains(event.target as Node)) {
        setIsExperienceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GSAP Animation for dropdown
  useEffect(() => {
    if (isLawTypeOpen) {
      gsap.fromTo(dropdownContentRef.current, 
        { 
          opacity: 0, 
          y: -10, 
          scaleY: 0.9, 
          transformOrigin: "top center",
          display: "none"
        },
        { 
          opacity: 1, 
          y: 0, 
          scaleY: 1, 
          duration: 0.2, 
          ease: "power2.out",
          display: "block"
        }
      );
    } else {
      gsap.to(dropdownContentRef.current, {
        opacity: 0,
        y: -10,
        scaleY: 0.9,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (dropdownContentRef.current) {
            dropdownContentRef.current.style.display = "none";
          }
        }
      });
    }
  }, [isLawTypeOpen]);

  // GSAP Animation for Experience dropdown
  useEffect(() => {
    if (isExperienceOpen) {
      gsap.fromTo(expDropdownContentRef.current, 
        { 
          opacity: 0, 
          y: -10, 
          scaleY: 0.9, 
          transformOrigin: "top center",
          display: "none"
        },
        { 
          opacity: 1, 
          y: 0, 
          scaleY: 1, 
          duration: 0.2, 
          ease: "power2.out",
          display: "block"
        }
      );
    } else {
      gsap.to(expDropdownContentRef.current, {
        opacity: 0,
        y: -10,
        scaleY: 0.9,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (expDropdownContentRef.current) {
            expDropdownContentRef.current.style.display = "none";
          }
        }
      });
    }
  }, [isExperienceOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f]">
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-10 text-gray-900 dark:text-white font-serif">
        
        {/* Header Section */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2 font-serif">
            Lawyer Marketplace
          </h1>
          <p className="text-gray-600 dark:text-white/70 text-[15px] font-sans">
            Browse verified lawyers matched to your legal case and consult them directly.
          </p>
        </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 font-sans w-full relative z-40">
        {/* Law Type GSAP Dropdown */}
        <div className="relative z-50 shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setIsLawTypeOpen(!isLawTypeOpen)}
            className={`flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-56
              ${isLawTypeOpen ? 'bg-[#213a56] ring-1 ring-[#cdaa80]/50' : 'hover:bg-[#213a56]'}
            `}
          >
            <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="flex-1 text-left text-sm truncate">{selectedLawType}</span>
            <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isLawTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* GSAP Animated Dropdown Content */}
          <div 
            ref={dropdownContentRef}
            className="absolute top-full left-0 mt-2 w-56 bg-[#0f1e3f] border border-[#cdaa80]/30 rounded-lg shadow-2xl overflow-hidden hidden"
            style={{ display: 'none' }}
          >
            <div className="max-h-[240px] overflow-y-auto custom-scrollbar bg-[#0f1e3f] py-1">
              {lawTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedLawType(type);
                    setIsLawTypeOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${selectedLawType === type 
                      ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium' 
                      : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Glowing Horizontal Price Wheel */}
        <div className="relative w-full md:w-[420px] h-16 bg-[#0a152e] shrink-0 flex items-center justify-center overflow-hidden rounded-full border border-[#cdaa80]/20 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),_0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Edge gradients for smooth masking */}
          <div className="absolute left-0 w-24 h-full bg-gradient-to-r from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-l-full" />
          <div className="absolute right-0 w-24 h-full bg-gradient-to-l from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-r-full" />

          {/* Center highlight ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[46px] bg-[#cdaa80]/15 border border-[#cdaa80]/70 rounded-full z-10 pointer-events-none shadow-[0_0_20px_rgba(205,170,128,0.3)] backdrop-blur-[1px]" />

          {/* Slidable Track */}
          <div 
            className="absolute top-1/2 left-1/2 flex items-center transition-transform duration-500 ease-out z-10"
            style={{ 
               transform: `translate(calc(-${selectedPriceIndex * 84 + 42}px), -50%)` 
            }}
          >
            {priceOptions.map((price, idx) => {
              const dist = Math.abs(idx - selectedPriceIndex);
              const isSelected = dist === 0;
              const scale = isSelected ? 1.05 : Math.max(0.7, 1 - dist * 0.15);
              const opacity = isSelected ? 1 : Math.max(0.15, 1 - dist * 0.25);

              return (
                <div 
                  key={price}
                  onClick={() => setSelectedPriceIndex(idx)}
                  className={`w-[84px] shrink-0 text-center cursor-pointer transition-all duration-300 font-serif tracking-wide text-[16px]
                    ${isSelected ? 'text-[#cdaa80] drop-shadow-[0_0_12px_rgba(205,170,128,1)]' : 'text-[#cdaa80]/50 hover:text-[#cdaa80]/80'}
                  `}
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                  }}
                >
                  {price}
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Dropdown */}
        <div className="relative z-50 shrink-0" ref={expDropdownRef}>
          <button 
            onClick={() => setIsExperienceOpen(!isExperienceOpen)}
            className={`flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-64
              ${isExperienceOpen ? 'bg-[#213a56] ring-1 ring-[#cdaa80]/50' : 'hover:bg-[#213a56]'}
            `}
          >
            <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="flex-1 text-left text-sm truncate">{selectedExperience}</span>
            <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isExperienceOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* GSAP Animated Dropdown Content */}
          <div 
            ref={expDropdownContentRef}
            className="absolute top-full left-0 mt-2 w-64 bg-[#0f1e3f] border border-[#cdaa80]/30 rounded-lg shadow-2xl overflow-hidden hidden"
            style={{ display: 'none' }}
          >
            <div className="max-h-[240px] overflow-y-auto custom-scrollbar bg-[#0f1e3f] py-1">
              {experienceLevels.map((exp) => (
                <button
                  key={exp}
                  onClick={() => {
                    setSelectedExperience(exp);
                    setIsExperienceOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${selectedExperience === exp 
                      ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium' 
                      : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'}
                  `}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Lawyers List */}
        <div className="space-y-6">
          {LAWYERS.map((lawyer) => (
            <div 
              key={lawyer.id}
              onMouseEnter={() => setHoveredCard(lawyer.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`
                bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-6 md:p-8 
                transition-all duration-300 ease-out cursor-pointer relative overflow-hidden shadow-lg border border-gray-100 dark:border-transparent
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
      
      {/* Global CSS for the custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f1e3f;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #213a56;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(205, 170, 128, 0.5);
        }
      `}} />

      </div>
    </div>
  );
}
