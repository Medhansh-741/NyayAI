"use client";

import Header from "../../components/header";
import Scene from "../../components/Scene";

export default function Page() {
  return (
    <main className="min-h-screen relative flex flex-col bg-transparent text-slate-900 dark:text-[#d2ad82] overflow-hidden font-serif">
      {/* 3D Scene Background */}
      <Scene />

      {/* Grid Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-evenly opacity-10">
        <div className="w-[1px] h-full bg-slate-900 dark:bg-white"></div>
        <div className="w-[1px] h-full bg-slate-900 dark:bg-white"></div>
        <div className="w-[1px] h-full bg-slate-900 dark:bg-white"></div>
        <div className="w-[1px] h-full bg-slate-900 dark:bg-white"></div>
      </div>

      <Header
        themeColors={{
          light: { bgInitial: "transparent", bgScrolled: "#F5F0E8", textInitial: "#443831", textScrolled: "#443831" },
          dark: { bgInitial: "transparent", bgScrolled: "#111a28", textInitial: "#d2ad82", textScrolled: "#d2ad82" }
        }}
      />

      <section className="relative z-10 min-h-[100vh] flex flex-col justify-center pt-32 pb-20 px-12 md:px-24 pointer-events-none">
        <div className="max-w-xl space-y-16">

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-medium tracking-wide">
              NyayaAI: Intelligent Legal Assistance for Every Indian Citizen
            </h1>
            <p className="text-sm md:text-base text-slate-700 dark:text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              NyayaAI is a production-grade legal assistance platform delivering instant analysis, 
              grounded in the latest BNS, BNSS, and IPC statutes. Empowering citizens with 
              verified legal guidance at their fingertips.
            </p>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute -right-8 top-0 w-6 h-6 border-l-2 border-t-2 border-slate-900 dark:border-[#d2ad82] rotate-45 transform origin-bottom-right"></div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-wide">
              AI-Powered Legal Research
            </h2>
            <p className="text-sm md:text-base text-slate-700 dark:text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              Our five-agent pipeline processes your situation to extract facts, identify applicable 
              laws, and generate court-ready documents. All results include confidence scores and 
              direct citations to verified statutes.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-medium tracking-wide">
              Verified Lawyer Marketplace
            </h2>
            <p className="text-sm md:text-base text-slate-700 dark:text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              Connect with matched legal professionals through our dual-sided marketplace. 
              Citizens get AI-prepared briefs while lawyers access a purpose-built portal to 
              manage cases and provide expert representation.
            </p>
          </div>

        </div>
      </section>

      {/* Footer removed */}
    </main>
  );
}
