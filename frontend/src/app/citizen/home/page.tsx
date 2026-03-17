'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from '../../../../components/sidebar';
import gsap from 'gsap';

import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isError?: boolean;
  type?: 'text' | 'follow_up' | 'analysis_result';
  metadata?: {
    questions?: string[];
    summary?: string;
    standing?: string;
    actionPlan?: any;
    legalMapping?: any;
    generatedDocuments?: any;
    reasoningTrace?: any;
  };
}

export default function CitizenHome() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      type: 'text',
      content: "Namaste! 👋 I'm NyayaAI. Describe your legal situation, and I will analyze the applicable laws and suggest next steps. You can also upload documents or evidence!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);  useEffect(() => {
    // Scroll to bottom whenever messages change or loading state changes
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(iconsRef.current, {
        opacity: 0,
        y: -15,
        duration: 0.6,
        ease: 'power3.out'
      })
      .from(headerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out'
      }, "-=0.4")
      .from(inputBarRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      }, "-=0.6");
      
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/analyze', {
        case_id: caseId,
        raw_narrative: textToSend,
        language_preference: "english",
        state_jurisdiction: "Maharashtra",
        mode: "citizen"
      });

      const result = response.data;
      const newCaseId = result.case_state?.case_id;
      if (newCaseId) setCaseId(newCaseId);

      let aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "",
        timestamp: new Date(),
        type: 'text'
      };

      if (result.intake_status === "awaiting_user_response") {
        aiMessage.type = 'text'; // Changed to text to avoid button rendering
        aiMessage.content = result.case_state?.conversational_response || "To provide the best guidance, I need a few more details.";
      } else if (result.intake_status === "complete") {
        aiMessage.type = 'analysis_result';
        aiMessage.content = "Your legal analysis is complete. Here is a summary of our findings and the recommended path forward.";
        aiMessage.metadata = {
          summary: result.case_state?.structured_facts?.incident_summary,
          standing: result.case_state?.legal_mapping?.legal_standing_score,
          actionPlan: result.case_state?.action_plan,
          legalMapping: result.case_state?.legal_mapping,
          generatedDocuments: result.case_state?.generated_documents,
          reasoningTrace: result.case_state?.reasoning_trace
        };
      } else {
        // Fallback for greetings or simple responses from conversational sync
        aiMessage.content = result.case_state?.conversational_response || "I've processed your input. How else can I help you today?";
      }

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm having trouble connecting to the legal engine right now. Please check if the backend is running and try again.",
        timestamp: new Date(),
        isError: true,
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden" ref={containerRef}>
      {/* Sidebar */}
      <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full w-full">
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

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 pt-24 pb-40 custom-scrollbar">
          <div className="max-w-4xl mx-auto flex flex-col gap-8 md:px-6">
            
            {/* Header */}
            <div ref={headerRef} className="text-left cursor-default">
              <h1 className="text-[26px] md:text-[28px] lg:text-[32px] font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2 font-serif transition-colors duration-500 hover:text-[#7a6042] dark:hover:text-[#e0c3a0]">
                NyayaAI Legal Assistant
              </h1>
              <p className="text-gray-600 dark:text-white/60 text-[15px] font-sans user-select-none hover:text-gray-800 dark:hover:text-white/80 transition-colors duration-300">
                Describe your legal situation and receive AI-powered legal guidance instantly.
              </p>
            </div>

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`animate-message ${
                  msg.role === 'ai' 
                  ? 'bg-white dark:bg-[#213a56]/40 rounded-xl rounded-tl-sm border border-gray-200 dark:border-transparent' 
                  : 'bg-[#997953]/10 dark:bg-[#cdaa80]/10 rounded-xl rounded-tr-sm border border-[#997953]/20 dark:border-[#cdaa80]/20 self-end ml-12'
                } p-6 shadow-sm dark:shadow-xl dark:shadow-[#000000]/20 transition-all duration-300 backdrop-blur-sm max-w-[85%] ${
                  msg.isError ? 'border-red-400/50 dark:border-red-400/30' : ''
                }`}
              >
                {msg.role === 'ai' && (
                  <h2 className="text-[14px] font-medium text-[#997953] dark:text-[#cdaa80] flex items-center gap-2 mb-2 transition-colors">
                    NyayaAI <span role="img" aria-label="assistant" className="inline-block">⚖️</span>
                  </h2>
                )}
                <p className={`text-[15px] leading-relaxed font-sans whitespace-pre-wrap ${
                  msg.role === 'ai' ? 'text-gray-700 dark:text-white/85' : 'text-gray-800 dark:text-white'
                } ${msg.isError ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {msg.content}
                </p>

                {/* Follow-up Questions - REMOVED for SYNC Chat */}

                {/* Analysis Result Card */}
                {msg.type === 'analysis_result' && msg.metadata && (
                  <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-[#997953]/10 to-transparent dark:from-[#cdaa80]/10 dark:to-transparent border border-[#997953]/20 dark:border-[#cdaa80]/20 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-[2px] font-bold text-[#997953] dark:text-[#cdaa80]">Legal Perspective</span>
                      <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        msg.metadata.standing === 'strong' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 
                        msg.metadata.standing === 'moderate' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' : 
                        'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                        {msg.metadata.standing} Standing
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[13px] font-semibold text-gray-500 dark:text-white/40 mb-1">Case Summary</h4>
                        <p className="text-[14px] text-gray-700 dark:text-white/80 leading-relaxed italic line-clamp-3">
                          &quot;{msg.metadata.summary}&quot;
                        </p>
                      </div>

                      {/* Toggle Button */}
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            setExpandedCards(prev => {
                              const next = new Set(prev);
                              next.has(msg.id) ? next.delete(msg.id) : next.add(msg.id);
                              return next;
                            });
                          }}
                          className="text-[13px] font-medium text-[#997953] dark:text-[#cdaa80] hover:underline underline-offset-4 flex items-center gap-1 group cursor-pointer"
                        >
                          {expandedCards.has(msg.id) ? 'Collapse Details' : 'View Full Action Plan'}
                          <svg className={`w-4 h-4 transition-transform duration-300 ${expandedCards.has(msg.id) ? 'rotate-90' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>

                      {/* Expanded Content */}
                      {expandedCards.has(msg.id) && (
                        <div className="mt-4 space-y-6 border-t border-[#997953]/10 dark:border-[#cdaa80]/10 pt-6 animate-message">

                          {/* ─── Action Plan Steps ─── */}
                          {msg.metadata.actionPlan && (
                            <div>
                              <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Action Plan</h4>
                              
                              {/* Immediate Steps */}
                              {msg.metadata.actionPlan.immediate?.length > 0 && (
                                <div className="mb-4">
                                  <span className="text-[11px] uppercase tracking-wider font-semibold text-red-500 dark:text-red-400 mb-2 block">⚡ Immediate Steps</span>
                                  <div className="space-y-2">
                                    {msg.metadata.actionPlan.immediate.map((step: any, i: number) => (
                                      <div key={i} className="p-3 rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5">
                                        <div className="flex items-start justify-between gap-2">
                                          <span className="text-[14px] font-medium text-gray-800 dark:text-white">{step.step}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold uppercase ${
                                            step.priority === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                          }`}>{step.priority}</span>
                                        </div>
                                        <p className="text-[13px] text-gray-600 dark:text-white/60 mt-1">{step.description}</p>
                                        <span className="text-[11px] text-gray-400 dark:text-white/30 mt-1 block">⏱ {step.deadline}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Medium-Term Steps */}
                              {msg.metadata.actionPlan.medium_term?.length > 0 && (
                                <div className="mb-4">
                                  <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-500 dark:text-blue-400 mb-2 block">📋 Medium-Term Steps</span>
                                  <div className="space-y-2">
                                    {msg.metadata.actionPlan.medium_term.map((step: any, i: number) => (
                                      <div key={i} className="p-3 rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5">
                                        <span className="text-[14px] font-medium text-gray-800 dark:text-white">{step.step}</span>
                                        <p className="text-[13px] text-gray-600 dark:text-white/60 mt-1">{step.description}</p>
                                        <span className="text-[11px] text-gray-400 dark:text-white/30 mt-1 block">⏱ {step.deadline}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Key Metrics Row */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Forum</span>
                                  <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{msg.metadata.actionPlan.forum_selection || 'N/A'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Timeline</span>
                                  <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{msg.metadata.actionPlan.timeline_estimate || 'N/A'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Est. Cost</span>
                                  <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{msg.metadata.actionPlan.cost_estimate || 'N/A'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Lawyer</span>
                                  <span className={`text-[12px] font-medium mt-1 block ${msg.metadata.actionPlan.lawyer_recommended ? 'text-red-500' : 'text-green-500'}`}>
                                    {msg.metadata.actionPlan.lawyer_recommended ? 'Recommended' : 'Not Required'}
                                  </span>
                                </div>
                              </div>

                              {/* Evidence Checklist */}
                              {msg.metadata.actionPlan.evidence_checklist?.length > 0 && (
                                <div className="mt-4">
                                  <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-white/40 mb-2 block">📎 Evidence Checklist</span>
                                  <ul className="space-y-1">
                                    {msg.metadata.actionPlan.evidence_checklist.map((item: string, i: number) => (
                                      <li key={i} className="text-[13px] text-gray-600 dark:text-white/60 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#cdaa80] shrink-0"></span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ─── Applicable Legal Sections ─── */}
                          {msg.metadata.legalMapping?.applicable_sections?.length > 0 && (
                            <div>
                              <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Applicable Legal Sections</h4>
                              <div className="space-y-2">
                                {msg.metadata.legalMapping.applicable_sections.map((s: any, i: number) => (
                                  <details key={i} className="group rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                                    <summary className="p-3 cursor-pointer flex items-center justify-between text-[13px] font-medium text-gray-800 dark:text-white hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                      <span>📜 {s.section_ref}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        s.confidence === 'high' ? 'bg-green-500/10 text-green-600' : 
                                        s.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                                      }`}>{s.confidence}</span>
                                    </summary>
                                    <div className="px-3 pb-3 text-[12px] text-gray-600 dark:text-white/50 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-2">
                                      {s.description?.substring(0, 300)}{s.description?.length > 300 ? '...' : ''}
                                    </div>
                                  </details>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ─── Generated Documents ─── */}
                          {msg.metadata.generatedDocuments && (
                            <div>
                              <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Generated Documents</h4>
                              <div className="space-y-3">
                                {Object.entries(msg.metadata.generatedDocuments).map(([key, doc]: [string, any]) => {
                                  if (!doc || !doc.content_md) return null;
                                  return (
                                    <details key={key} className="group rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                                      <summary className="p-3 cursor-pointer flex items-center justify-between text-[13px] font-medium text-gray-800 dark:text-white hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                        <span>📄 {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        <div className="flex items-center gap-2">
                                          {doc.pdf_url && (
                                            <a href={`http://localhost:8000/download/${doc.pdf_url.split(/[\\/]/).pop()}`} download className="text-[10px] px-2 py-1 rounded bg-[#997953]/10 dark:bg-[#cdaa80]/10 text-[#997953] dark:text-[#cdaa80] font-bold uppercase hover:bg-[#997953]/20 dark:hover:bg-[#cdaa80]/20 transition-colors" onClick={(e) => e.stopPropagation()}>PDF ↓</a>
                                          )}
                                          {doc.docx_url && (
                                            <a href={`http://localhost:8000/download/${doc.docx_url.split(/[\\/]/).pop()}`} download className="text-[10px] px-2 py-1 rounded bg-[#997953]/10 dark:bg-[#cdaa80]/10 text-[#997953] dark:text-[#cdaa80] font-bold uppercase hover:bg-[#997953]/20 dark:hover:bg-[#cdaa80]/20 transition-colors" onClick={(e) => e.stopPropagation()}>DOCX ↓</a>
                                          )}
                                        </div>
                                      </summary>
                                      <div className="px-4 pb-4 text-[12px] text-gray-700 dark:text-white/70 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3 whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {doc.content_md}
                                      </div>
                                    </details>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* ─── Reasoning Trace ─── */}
                          {msg.metadata.reasoningTrace && (
                            <div>
                              <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">AI Reasoning</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase ${
                                    msg.metadata.reasoningTrace.overall_confidence === 'high' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 
                                    msg.metadata.reasoningTrace.overall_confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : 
                                    'bg-red-500/10 text-red-600 border border-red-500/20'
                                  }`}>Confidence: {msg.metadata.reasoningTrace.overall_confidence}</span>
                                </div>
                                {msg.metadata.reasoningTrace.legal_standing_breakdown && (
                                  <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
                                    {msg.metadata.reasoningTrace.legal_standing_breakdown}
                                  </p>
                                )}
                                {msg.metadata.reasoningTrace.agent_logs?.length > 0 && (
                                  <details className="rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5">
                                    <summary className="p-2 cursor-pointer text-[11px] font-medium text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60">Agent Activity Log ({msg.metadata.reasoningTrace.agent_logs.length} entries)</summary>
                                    <div className="px-3 pb-3 space-y-1">
                                      {msg.metadata.reasoningTrace.agent_logs.map((log: string, i: number) => (
                                        <p key={i} className="text-[11px] text-gray-500 dark:text-white/40 font-mono">{log}</p>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="animate-message bg-white dark:bg-[#213a56]/40 rounded-xl rounded-tl-sm border border-gray-200 dark:border-transparent p-6 shadow-sm dark:shadow-xl dark:shadow-[#000000]/20 backdrop-blur-sm w-fit">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#997953] dark:bg-[#cdaa80] animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#997953] dark:bg-[#cdaa80] animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#997953] dark:bg-[#cdaa80] animate-bounce"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input Area at Bottom */}
        <div ref={inputBarRef} className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0f1e3f] dark:via-[#0f1e3f] dark:to-transparent z-20">
          <div className="max-w-4xl mx-auto md:px-6">
            <div className="flex items-center gap-4 w-full group relative">
              
              {/* Plus Button */}
              <button 
                type="button"
                disabled={isLoading}
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border border-gray-300 dark:border-white/10 dark:bg-transparent bg-white text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 active:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer shadow-sm z-10 outline-none focus:ring-2 focus:ring-[#997953]/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add attachment"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              {/* Input Field */}
              <form 
                className="flex-1 relative cursor-text transition-transform duration-300"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? "Generating analysis..." : "Describe your legal situation..."}
                  className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#cdaa80]/30 rounded-full px-6 py-4 md:py-[18px] text-[15px] outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:border-[#997953] dark:focus:border-[#cdaa80] focus:ring-1 focus:ring-[#997953] dark:focus:ring-[#cdaa80] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-gray-400 dark:hover:border-[#cdaa80]/60 hover:bg-white/50 dark:hover:bg-[#213a56]/20 focus:bg-white dark:focus:bg-[#1a2c47]/50 disabled:opacity-70 disabled:cursor-wait"
                />
              </form>
              
              {/* Send Button */}
              <button 
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#997953] dark:bg-[#cdaa80] text-white dark:text-[#0f1e3f] hover:bg-[#7a6042] dark:hover:bg-[#e0c3a0] hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-[#cdaa80]/20 transition-all duration-300 shrink-0 cursor-pointer shadow-md z-10 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#997953] dark:focus:ring-[#cdaa80] dark:focus:ring-offset-[#0f1e3f] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 ml-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l8-2 10-5-5 10-2 8-3-8-8-3z" />
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>
      
      {/* Global CSS for animations and custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(205, 170, 128, 0.2);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(205, 170, 128, 0.5);
        }
      `}} />
    </div>
  );
}