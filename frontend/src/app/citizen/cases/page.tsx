'use client';

import React, { useState } from 'react';

// Example cases data
const INITIAL_CASES = [
  {
    id: 1,
    title: "Security Deposit Not Returned by Landlord",
    description: "Tenant vacated apartment but landlord refused to return ₹50,000 deposit. AI analysis indicates possible tenant protection violation.",
    domain: "Tenant Law",
    date: "Mar 14, 2026",
    status: "Submitted",
    icons: ["home", "gavel"] // Simplified representation for icons
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
    <div className="max-w-[1200px] mx-auto p-6 md:p-8 text-white h-screen flex flex-col bg-[#0f1e3f]">
      
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
        {/* Search Bar */}
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

        {/* Filters Row */}
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

      {/* Scrollable Cases List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {filteredCases.map((c) => (
          <div 
            key={c.id}
            onClick={() => setClickedCardId(c.id)}
            onAnimationEnd={() => setClickedCardId(null)}
            className={`
              bg-[#213a56] rounded-lg p-5 border border-transparent 
              hover:border-[#cdaa80]/50 cursor-pointer text-left w-full
              transition-all duration-200 shadow-sm relative group overflow-hidden
            `}
          >
            {/* Click ripple animation effect */}
            {clickedCardId === c.id && (
              <span className="absolute inset-0 bg-[#cdaa80]/10 animate-pulse pointer-events-none rounded-lg ring-1 ring-[#cdaa80]"></span>
            )}
            
            <div className="flex justify-between items-start mb-2 gap-4 relative z-10">
              <h3 className="text-white font-medium text-[16px] group-hover:text-[#cdaa80] transition-colors">{c.title}</h3>
              <div className="flex items-center gap-3 shrink-0">
                {c.icons.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[#cdaa80]/80">
                    {/* Small scale icon */}
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    {/* Small gavel icon */}
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                )}
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium border
                  ${c.status === 'Submitted' ? 'bg-[#cdaa80] text-[#0f1e3f] border-transparent' : 
                    c.status === 'Under AI Analysis' ? 'bg-[#cdaa80]/10 text-[#cdaa80] border-[#cdaa80]/40' :
                    c.status === 'Case Completed' ? 'bg-white/10 text-white border-white/20' :
                    'bg-[#cdaa80]/10 text-[#cdaa80] border-[#cdaa80]/40'}
                `}>
                  {c.status}
                </span>
              </div>
            </div>
            
            <p className="text-white/70 text-[14px] leading-relaxed mb-4 pr-12 relative z-10">
              {c.description}
            </p>
            
            <div className="flex items-center text-white/50 text-[13px] relative z-10">
              <span>Domain: {c.domain}</span>
              <span className="mx-2">|</span>
              <span>Date: {c.date}</span>
            </div>
          </div>
        ))}
        
        {filteredCases.length === 0 && (
          <div className="text-center py-12 text-white/50">
            No cases found matching your search.
          </div>
        )}
      </div>
      
      {/* Global CSS for the custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
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
      
    </div>
  );
}
