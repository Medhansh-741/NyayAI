'use client';

import React, { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [clickedCardId, setClickedCardId] = useState<number | null>(null);

  // Filter cases based on search query
  const filteredCases = INITIAL_CASES.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0f1e3f]">
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-8 text-white flex flex-col pb-24 md:pb-8">

        {/* Top Header/Nav Area */}
        <div className="flex border-b border-[#213a56] pb-2 mb-6 shrink-0">
          <nav className="flex gap-6 text-sm">
            <button className="text-[#cdaa80] border-b-2 border-[#cdaa80] pb-2 font-medium">Cases</button>
            <button className="text-white/60 hover:text-white transition-colors pb-2">Documents</button>
            <button className="text-white/60 hover:text-white transition-colors pb-2">Legal Tools</button>
            <button className="text-white/60 hover:text-white transition-colors pb-2">Generated Documents</button>
          </nav>
        </div>

        {/* Search and Filters Area */}
        <div className="space-y-4 mb-6 shrink-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-white/40 group-focus-within:text-[#cdaa80] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-[#213a56] border border-[#213a56] focus:border-[#cdaa80] rounded-md pl-11 pr-4 py-2.5 text-sm outline-none text-white placeholder-white/40 transition-colors shadow-sm"
              placeholder="Search your legal cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select className="bg-transparent border border-[#213a56] text-white/80 text-xs rounded px-3 py-1.5 outline-none hover:border-white/30 transition-colors appearance-none cursor-pointer pr-8 relative">
              <option className="bg-[#0f1e3f]">Select Case</option>
            </select>

            <select className="bg-transparent border border-[#213a56] text-white/80 text-xs rounded px-3 py-1.5 outline-none hover:border-white/30 transition-colors appearance-none cursor-pointer pr-8 relative">
              <option className="bg-[#0f1e3f]">Case Type</option>
            </select>

            <select className="bg-transparent border border-[#213a56] text-white/80 text-xs rounded px-3 py-1.5 outline-none hover:border-white/30 transition-colors appearance-none cursor-pointer pr-8 relative">
              <option className="bg-[#0f1e3f]">Legal Domain</option>
            </select>

            <select className="bg-transparent border border-[#213a56] text-white/80 text-xs rounded px-3 py-1.5 outline-none hover:border-white/30 transition-colors appearance-none cursor-pointer pr-8 relative">
              <option className="bg-[#0f1e3f]">Case Status</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-white/60">Sort:</span>
              <select className="bg-transparent border border-[#213a56] text-white/80 text-xs rounded px-3 py-1.5 outline-none hover:border-white/30 transition-colors appearance-none cursor-pointer pr-8 relative">
                <option className="bg-[#0f1e3f]">Latest Case</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Cases List - Updated with Yellow Card Theme */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => setClickedCardId(c.id)}
              onAnimationEnd={() => setClickedCardId(null)}
              className={`
              bg-[#d9c5a0] rounded-lg p-6 border border-transparent 
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