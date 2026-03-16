import React from 'react';

export default function CitizenHome() {
  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-8 text-white min-h-screen bg-[#0f1e3f]">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium tracking-wide text-[#cdaa80] mb-1">
          NyayaAI Legal Assistant
        </h1>
        <p className="text-white/60 text-sm">
          Describe your legal situation and receive AI-powered legal guidance instantly.
        </p>
      </div>

      {/* AI Input Box - Tall empty area with chat at bottom */}
      <section className="bg-[#213a56]/80 rounded-2xl border border-[#cdaa80]/30 p-6 flex flex-col justify-end min-h-[450px] mb-10 shadow-2xl relative overflow-hidden">
        
        {/* Subtle background glow/gradient if desired */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1e3f]/40 to-[#0f1e3f]/90 pointer-events-none" />

        <div className="relative z-10 w-full space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-medium text-[#cdaa80] flex items-center gap-2">
              Namaste! <span role="img" aria-label="folded hands">🙏</span> I'm NyayaAI.
            </h2>
            <p className="text-white/80 text-sm">
              Describe your legal situation and I will analyze the applicable laws and suggest next steps. You can also upload documents or evidence!
            </p>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button 
              type="button"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-[#cdaa80]/40 bg-[#0f1e3f] text-[#cdaa80] hover:bg-[#997953] hover:text-white hover:border-[#997953] transition-colors shrink-0 outline-none focus:ring-2 focus:ring-[#cdaa80]/50"
              aria-label="Upload document"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Describe your legal situation..." 
                className="w-full bg-[#0f1e3f] border border-[#cdaa80] rounded-full px-6 py-3 text-sm outline-none text-white placeholder-white/50 focus:ring-1 focus:ring-[#cdaa80] focus:border-[#cdaa80] transition-all"
              />
            </div>
            <button 
              type="button"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#cdaa80] text-[#0f1e3f] hover:bg-[#997953] hover:text-white transition-colors shrink-0 outline-none focus:ring-2 focus:ring-[#cdaa80] focus:ring-offset-2 focus:ring-offset-[#0f1e3f]"
            >
              <svg className="w-4 h-4 ml-0.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Legal Cases Section */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-[15px] font-medium text-[#cdaa80]">Recent Legal Cases</h2>
          <span className="text-xs text-white/50">Latest activity</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1 */}
          <div className="bg-[#213a56] rounded-xl border border-[#cdaa80]/20 p-5 flex flex-col hover:border-[#cdaa80]/50 transition-colors cursor-pointer shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5 text-[11px] text-[#cdaa80]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#cdaa80]"></div>
                <span>DL-2026-00105</span>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded text-[10px] font-medium bg-[#cdaa80] text-[#0f1e3f]">
                Under Analysis
              </span>
            </div>
            
            <h3 className="text-sm text-white font-medium mb-4 leading-relaxed line-clamp-2">
              Landlord refusing to return security deposit
            </h3>
            
            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">Delhi District Court Jurisdiction</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="line-clamp-1">Tenant Law</span>
              </div>
            </div>
            
            <div className="mt-5 text-[10px] text-white/40">
              20h ago
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#213a56] rounded-xl border border-[#cdaa80]/20 p-5 flex flex-col hover:border-[#cdaa80]/50 transition-colors cursor-pointer shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                <span>DL-2026-00094</span>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded text-[10px] font-medium bg-[#0f1e3f] text-[#cdaa80] border border-[#cdaa80]/30">
                Drafting Notice
              </span>
            </div>
            
            <h3 className="text-sm text-white font-medium mb-4 leading-relaxed line-clamp-2">
              Employer withheld final salary after resignation
            </h3>
            
            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">Bangalore Labour Court</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="line-clamp-1">Labour Law</span>
              </div>
            </div>
            
            <div className="mt-5 text-[10px] text-white/40">
              5d ago
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#213a56] rounded-xl border border-[#cdaa80]/20 p-5 flex flex-col hover:border-[#cdaa80]/50 transition-colors cursor-pointer shadow-lg shadow-black/20">
             <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                <span>DL-2026-00091</span>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded text-[10px] font-medium bg-[#cdaa80] text-[#0f1e3f]">
                Submitted
              </span>
            </div>
            
            <h3 className="text-sm text-white font-medium mb-4 leading-relaxed line-clamp-2">
              Online fraud through payment app
            </h3>
            
            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">Cyber Crime Cell — Mumbai</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="line-clamp-1">Cyber Law</span>
              </div>
            </div>
            
            <div className="mt-5 text-[10px] text-white/40">
              5d ago
            </div>
          </div>

        </div>
      </section>
      
    </div>
  );
}