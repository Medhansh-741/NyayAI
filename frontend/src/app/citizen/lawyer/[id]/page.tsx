'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Sidebar } from '../../../../../components/sidebar';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Database } from '../../../../types/supabase';
import { BadgeCheck, ArrowLeft, FileText, Scale, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { getActiveCaseForUser, setActiveCaseForUser } from '@/lib/db/sessions';
import { createBriefDispatch } from '@/lib/db/dispatches';
import { getCitizenCases } from '@/lib/db/cases';
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// We get the params promise from Next.js dynamic routing
export default function LawyerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Unwrap the params properly for React 19 / Next.js 15
  const resolvedParams = React.use(params);
  const lawyerId = resolvedParams.id;

  const [lawyer, setLawyer] = useState<Database['public']['Tables']['lawyer_profiles']['Row'] | null>(null);
  const [cases, setCases] = useState<Database['public']['Tables']['lawyer_case_history']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false)
  const [requestMsg, setRequestMsg] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [myCases, setMyCases] = useState<Database['public']['Tables']['cases']['Row'][]>([])
  const [casePickLoading, setCasePickLoading] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [introMessage, setIntroMessage] = useState('')
  const [introDirty, setIntroDirty] = useState(false)

  const buildIntroDraft = (c: Database['public']['Tables']['cases']['Row'] | null) => {
    const titlePart = c?.title ? `: "${c.title}"` : ''
    const domainPart = c?.domain ? String(c.domain).replace(/_/g, ' ') : 'this domain'
    const summary = c?.incident_description ? String(c.incident_description).slice(0, 500) : ''
    return (
      `Hi, I’m reaching out regarding my case${titlePart}.\n\n` +
      `${summary ? `Summary: ${summary}\n\n` : ''}` +
      `I’m looking for a lawyer experienced in ${domainPart}.\n` +
      `Please review the AI case draft and let me know next steps.`
    )
  }

  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        // Fetch lawyer profile
        const { data: profileData, error: profileErr } = await supabase
          .from('lawyer_profiles')
          .select('*')
          .eq('id', lawyerId)
          .single();

        if (profileErr) throw profileErr;
        setLawyer(profileData);

        // Fetch their public case history
        const { data: caseData, error: caseErr } = await supabase
          .from('lawyer_case_history')
          .select('*')
          .eq('lawyer_id', lawyerId)
          .order('year', { ascending: false });

        if (!caseErr && caseData) {
          setCases(caseData);
        }

      } catch (err) {
        console.error("Error fetching lawyer profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [lawyerId]);

  useGSAP(() => {
    if (loading) return; // Wait until data loads to animate

    const tl = gsap.timeline();

    // 1. Reveal Profile Image
    tl.fromTo('.profile-img', 
      { scale: 0.8, opacity: 0, rotation: -5 },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.5)', clearProps: 'all' }
    );

    // 2. Stagger text and small elements in Hero
    tl.fromTo('.hero-text', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', clearProps: 'all' },
      "-=0.4"
    );

    // 3. Action Buttons entrance
    tl.fromTo('.action-btn',
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out', clearProps: 'all' },
      "-=0.3"
    );

    // 4. Scroll triggered Case History cards
    gsap.utils.toArray('.case-card').forEach((card: unknown) => {
      gsap.fromTo(card as HTMLElement,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: {
            scroller: '#main-scroll-container',
            trigger: card as HTMLElement,
            start: 'top 90%', 
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // 5. Scroll triggered Additional Info block
    gsap.fromTo('.info-block',
      { y: 40, opacity: 0 },
      {
         y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
         scrollTrigger: {
           scroller: '#main-scroll-container',
           trigger: '.info-block',
           start: 'top 85%'
         }
      }
    );

  }, { scope: containerRef, dependencies: [loading] });

  const openRequestDialog = async () => {
    setRequestMsg(null)
    setIntroDirty(false)
    setIntroMessage('')
    setCasePickLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        setRequestMsg('Please log in to request a lawyer.')
        return
      }

      const { data: sessionRow } = await getActiveCaseForUser(authData.user.id)
      const activeCaseId = sessionRow?.active_case_id ?? null

      const { data, error } = await getCitizenCases(authData.user.id)
      if (error) {
        setRequestMsg(error.message)
        return
      }

      const list = (data ?? []).filter((c) => !!c.id)
      setMyCases(list)
      if (list.length === 0) {
        setRequestMsg('Please start a case in the chatbot first so we can attach this request.')
        return
      }

      const chosen = list.find((c) => c.id === activeCaseId) ?? list[0]
      setSelectedCaseId(chosen.id)
      setIntroMessage(buildIntroDraft(chosen))
      setRequestOpen(true)
    } finally {
      setCasePickLoading(false)
    }
  }

  const handleSendRequest = async () => {
    setRequestMsg(null)
    setRequesting(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        setRequestMsg('Please log in to request a lawyer.')
        return
      }
      if (!selectedCaseId) {
        setRequestMsg('Please select a case.')
        return
      }
      if (!introMessage || introMessage.trim().length === 0) {
        setRequestMsg('Please add an intro message.')
        return
      }
      if (introMessage.trim().length < 20) {
        setRequestMsg('Please provide a little more detail in your intro message (at least 20 characters).')
        return
      }

      await setActiveCaseForUser(authData.user.id, selectedCaseId)

      const { data: caseRow } = await supabase
        .from('cases')
        .select('id, title, domain, incident_description, budget_min, budget_max, preferred_state, preferred_district, case_brief, recommended_strategy, applicable_laws, confirmed_facts')
        .eq('id', selectedCaseId)
        .maybeSingle()

      const { data: docs } = await supabase
        .from('case_documents')
        .select('file_name, file_url, document_type, created_at')
        .eq('case_id', selectedCaseId)
        .order('created_at', { ascending: false })

      const aiBrief = {
        title: caseRow?.title ?? null,
        domain: caseRow?.domain ?? null,
        incident_description: caseRow?.incident_description ?? null,
        case_brief: caseRow?.case_brief ?? null,
        recommended_strategy: caseRow?.recommended_strategy ?? null,
        applicable_laws: caseRow?.applicable_laws ?? null,
        confirmed_facts: caseRow?.confirmed_facts ?? null,
      }

      const citizenInputs = {
        budget_min: caseRow?.budget_min ?? undefined,
        budget_max: caseRow?.budget_max ?? undefined,
        urgency: 'HIGH' as const,
        engagement_type: 'FULL_CASE' as const,
        case_goal: 'Need legal assistance',
        stage: 'INTAKE_COMPLETE',
        preferred_language: 'HINDI',
        communication_mode: 'CHAT_FIRST' as const,
        notes: 'Need quick response',
        preferred_state: caseRow?.preferred_state ?? undefined,
        preferred_district: caseRow?.preferred_district ?? undefined,
      }

      const { error: dispatchErr } = await createBriefDispatch({
        case_id: selectedCaseId,
        citizen_id: authData.user.id,
        lawyer_id: lawyerId,
        intro_message: introMessage.trim(),
        ai_brief: aiBrief,
        citizen_inputs: citizenInputs,
        documents: docs ?? [],
      })

      if (dispatchErr) {
        const msg = dispatchErr instanceof Error
          ? dispatchErr.message
          : (dispatchErr as { message?: string }).message ?? 'Failed to send request.'
        setRequestMsg(msg)
        return
      }

      setRequestOpen(false)
      setRequestMsg('Your case has been sent to the lawyer. You’ll receive a response within 24–48 hours.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="flex bg-[#111e3c] font-serif h-screen overflow-hidden" ref={containerRef}>
      {/* Sidebar Navigation */}
      <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] bg-[#0a152e]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div id="main-scroll-container" className="flex-1 flex flex-col relative h-full w-full overflow-y-auto custom-scrollbar">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#e6ce9e]/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto px-6 py-10 z-10 flex flex-col pt-16 md:pt-20">
          
          {/* Top Header Section removed per user request */}

          {/* ------------- 1. HERO SECTION ------------- */}
          <div className="bg-[#d6b785] rounded-[24px] p-8 md:p-12 pl-10 md:pl-[35%] relative shadow-2xl overflow-hidden mb-12">
            
            {/* Minimal Background Monogram/Texture */}
            <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%230f1e3f\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

            {/* Profile Image (Absolute positioning based on the reference image) */}
            <div className="profile-img absolute left-6 md:left-12 top-1/2 -translate-y-1/2 w-[160px] h-[160px] md:w-[220px] md:h-[220px] rounded-full overflow-hidden border-4 border-[#111e3c]/10 shadow-xl z-10 hidden md:block">
               {/* Fallback image color while loading */}
               <div className="w-full h-full bg-[#c6a775] object-cover"></div>
            </div>

            {/* Content Container */}
            <div className={`relative z-20 flex flex-col text-[#0f1e3f] transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {/* Back to Directory Link */}
                <Link href="/citizen/market_place" className="hero-text flex items-center gap-2 text-sm font-sans font-medium hover:text-[#0f1e3f]/70 transition-colors mb-4 inline-flex w-fit">
                  <ArrowLeft size={16} /> Back to Directory
                </Link>

                {lawyer ? (
                  <>
                    {/* Name and Designation row */}
                    <div className="hero-text flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-3 border-b border-[#0f1e3f]/20 pb-4">
                      <h1 className="text-4xl md:text-[42px] font-bold leading-none tracking-tight">{lawyer.full_name || 'Advocate'}</h1>
                      <span className="text-lg md:text-xl font-medium leading-tight opacity-90 border-l border-[#0f1e3f]/30 pl-4 py-1">
                        {lawyer.professional_title || 'Legal Specialist'} <br/>
                        <span className="text-[15px] font-normal">
                          practicing in {lawyer.court_types?.join(' and ') || lawyer.practice_district || 'District Courts'}
                        </span>
                      </span>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="hero-text flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 font-sans text-[13px] md:text-sm font-medium mb-4">
                      <div>Years of Experience: <span className="font-bold">{lawyer.experience_years || 0}+</span></div>
                      <div>Practice Courts: <span className="font-bold">{lawyer.court_types?.join(' - ') || 'Not specified'}</span></div>
                      {lawyer.languages && lawyer.languages.length > 0 && (
                        <div><span className="font-bold opacity-80">{lawyer.languages.join(', ')}</span></div>
                      )}
                      
                      {/* Verified Badge */}
                      {lawyer.verification_status === 'verified' && (
                        <div className="flex items-center gap-1.5 bg-[#22c55e]/20 text-[#166534] px-2.5 py-0.5 rounded text-xs font-bold border border-[#22c55e]/30 pt-1 pb-1">
                           <BadgeCheck size={14} className="text-[#16a34a]" /> Verified Advocate
                        </div>
                      )}
                    </div>

                    {/* Bio text */}
                    <p className="hero-text font-sans text-[15px] leading-relaxed opacity-90 mb-6 max-w-2xl pr-4">
                      {lawyer.bio || `${lawyer.full_name} is a legal professional practicing in ${lawyer.practice_state || 'India'}.`}
                    </p>

                    {/* Buttons / Contact */}
                    <div className="flex flex-wrap gap-4 font-sans font-medium text-sm mt-2">
                      <button
                        type="button"
                        onClick={() => void openRequestDialog()}
                        disabled={requesting || casePickLoading}
                        className="action-btn flex items-center gap-2 px-6 py-2.5 border border-[#0f1e3f] text-[#d6b785] bg-[#0f1e3f] rounded-md hover:bg-[#0f1e3f]/90 hover:shadow-[0_0_15px_rgba(15,30,63,0.35)] transition-all duration-300 disabled:opacity-60"
                      >
                        {casePickLoading ? 'Loading cases…' : requesting ? 'Sending request…' : 'Request this lawyer'}
                      </button>
                      <a 
                        href={`mailto:${lawyer.email || ''}`} 
                        className="action-btn flex items-center gap-2 px-6 py-2.5 border border-[#0f1e3f] text-[#0f1e3f] rounded-md hover:bg-[#0f1e3f] hover:text-[#d6b785] hover:shadow-[0_0_15px_rgba(15,30,63,0.4)] transition-all duration-300"
                      >
                        <Mail size={16} /> {lawyer.email || 'Email not provided'}
                      </a>
                      {lawyer.phone && (
                        <a 
                          href={`tel:${lawyer.phone}`} 
                          className="action-btn flex items-center gap-2 px-6 py-2.5 border border-[#0f1e3f]/40 text-[#0f1e3f] rounded-md hover:border-[#0f1e3f] hover:bg-[#0f1e3f] hover:text-[#d6b785] hover:shadow-[0_0_15px_rgba(15,30,63,0.4)] transition-all duration-300"
                        >
                          <Phone size={16} /> {lawyer.phone}
                        </a>
                      )}
                    </div>
                    {requestMsg && (
                      <div className="hero-text mt-4 text-sm font-sans text-[#0f1e3f]/80">
                        {requestMsg}
                      </div>
                    )}

                    <Dialog.Root open={requestOpen} onOpenChange={setRequestOpen}>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9998]" />
                        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-[#0a152e] border border-[#e3d4bf] dark:border-[#cdaa80]/25 shadow-2xl p-5 md:p-6 z-[9999]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Dialog.Title className="text-lg md:text-xl font-serif text-[#997953] dark:text-[#cdaa80]">
                                Request this lawyer
                              </Dialog.Title>
                              <Dialog.Description className="mt-1 text-sm font-sans text-[#5b4b3d] dark:text-white/70">
                                Choose the case you want to attach, then edit the intro message.
                              </Dialog.Description>
                            </div>
                            <Dialog.Close
                              disabled={requesting}
                              className="rounded-lg px-3 py-1.5 text-sm font-sans border border-[#d8c1a1] dark:border-[#cdaa80]/30 hover:bg-[#f9f4ec] dark:hover:bg-[#12284f] disabled:opacity-60"
                            >
                              Close
                            </Dialog.Close>
                          </div>

                          <div className="mt-4 space-y-4">
                            <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                              <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                                Select case
                              </div>
                              <div className="mt-2">
                                <Select.Root
                                  value={selectedCaseId ?? ''}
                                  onValueChange={(v) => {
                                    setSelectedCaseId(v)
                                    const chosen = myCases.find((c) => c.id === v) ?? null
                                    if (!introDirty) setIntroMessage(buildIntroDraft(chosen))
                                  }}
                                >
                                  <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-[#0f1e3f]/20 bg-[#fdf9f3] dark:bg-[#12284f]/70 px-3 py-2 text-sm font-sans text-[#0f1e3f] dark:text-white/85">
                                    <Select.Value placeholder="Pick a case" />
                                    <Select.Icon className="text-[#0f1e3f]/60 dark:text-white/60">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                                      </svg>
                                    </Select.Icon>
                                  </Select.Trigger>
                                  <Select.Portal>
                                    <Select.Content className="z-[10000] overflow-hidden rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 bg-white dark:bg-[#0a152e] shadow-2xl">
                                      <Select.Viewport className="p-1 max-h-[280px] overflow-y-auto">
                                        {myCases.map((c) => (
                                          <Select.Item
                                            key={c.id}
                                            value={c.id}
                                            className="px-3 py-2 rounded-lg text-sm font-sans text-[#0f1e3f] dark:text-white/85 cursor-pointer outline-none data-[highlighted]:bg-[#0f1e3f]/5 dark:data-[highlighted]:bg-[#213a56]"
                                          >
                                            <Select.ItemText>
                                              {(c.title ?? 'Untitled case').slice(0, 60)}{c.created_at ? ` • ${new Date(c.created_at).toLocaleDateString('en-IN')}` : ''}
                                            </Select.ItemText>
                                          </Select.Item>
                                        ))}
                                      </Select.Viewport>
                                    </Select.Content>
                                  </Select.Portal>
                                </Select.Root>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e7d9c7] dark:border-[#cdaa80]/20 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[11px] uppercase tracking-wide font-bold text-[#997953] dark:text-[#cdaa80]">
                                  Intro message (editable)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const chosen = selectedCaseId ? (myCases.find((c) => c.id === selectedCaseId) ?? null) : null
                                    setIntroMessage(buildIntroDraft(chosen))
                                    setIntroDirty(false)
                                  }}
                                  className="text-xs font-sans px-2.5 py-1 rounded-lg border border-[#0f1e3f]/20 hover:bg-[#0f1e3f]/5 dark:hover:bg-[#213a56]"
                                >
                                  Reset draft
                                </button>
                              </div>
                              <textarea
                                value={introMessage}
                                onChange={(e) => { setIntroDirty(true); setIntroMessage(e.target.value) }}
                                rows={6}
                                className="mt-2 w-full rounded-lg border border-[#0f1e3f]/20 bg-[#fdf9f3] dark:bg-[#12284f]/70 px-3 py-2 text-sm font-sans text-[#0f1e3f] dark:text-white/85 outline-none focus:ring-2 focus:ring-[#cdaa80]/40"
                                placeholder="Write a short message for the lawyer..."
                              />
                            </div>

                            <div className="flex items-center justify-end gap-3">
                              <Dialog.Close
                                disabled={requesting}
                                className="px-4 py-2 rounded-lg text-sm font-sans border border-[#0f1e3f]/20 hover:bg-[#0f1e3f]/5 dark:hover:bg-[#213a56] disabled:opacity-60"
                              >
                                Cancel
                              </Dialog.Close>
                              <button
                                type="button"
                                onClick={() => { void handleSendRequest() }}
                                disabled={requesting || !selectedCaseId || introMessage.trim().length < 20}
                                className="px-4 py-2 rounded-lg text-sm font-sans border border-[#0f1e3f] bg-[#0f1e3f] text-[#d6b785] hover:bg-[#0f1e3f]/90 disabled:opacity-60"
                              >
                                {requesting ? 'Sending…' : 'Send request'}
                              </button>
                            </div>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col gap-4 py-6">
                     <div className="h-10 bg-[#0f1e3f]/10 rounded w-1/3"></div>
                     <div className="h-4 bg-[#0f1e3f]/10 rounded w-full"></div>
                     <div className="h-4 bg-[#0f1e3f]/10 rounded w-2/3"></div>
                     <div className="flex gap-4 mt-2">
                       <div className="h-10 bg-[#0f1e3f]/10 rounded w-40"></div>
                       <div className="h-10 bg-[#0f1e3f]/10 rounded w-40"></div>
                     </div>
                  </div>
                )}

            </div>
          </div>

          {/* ------------- 2. CASE HISTORY SECTION ------------- */}
          <div className={`w-full mb-12 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
             <h2 className="text-2xl md:text-[28px] text-[#d6b785] mb-6">Case History</h2>
             
             {cases.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {cases.map((c) => (
                    <div key={c.id} className="case-card bg-[#d6b785] rounded-xl p-6 flex flex-col items-center justify-center text-center text-[#0f1e3f] hover:-translate-y-1 transition-transform cursor-default">
                      <div className="w-20 h-20 mb-4 bg-white/20 rounded-full flex items-center justify-center pointer-events-none">
                        {c.domain === 'criminal' ? <Scale size={32} strokeWidth={1.5} className="opacity-80"/> :
                         c.domain === 'family' ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> :
                         c.domain === 'property' ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> :
                         <FileText size={32} strokeWidth={1.5} className="opacity-80"/>}
                      </div>
                      <h3 className="font-bold text-[17px] font-sans leading-tight capitalize">{c.domain?.replace('_', ' ')} Case</h3>
                      <div className="font-sans text-sm opacity-90 my-1">{c.court_type || 'District Court'}</div>
                      <div className="font-sans text-sm font-medium capitalize">Outcome: <span className={`${c.outcome === 'won' || c.outcome === 'settled' ? 'text-green-800' : 'text-blue-800'} font-bold`}>{c.outcome}</span></div>
                      <div className="font-sans text-xs opacity-70 mt-1">{c.year}</div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="text-white/60 font-sans italic">No public case history recorded.</div>
             )}
          </div>

          {/* ------------- 3. ADDITIONAL INFO SECTION ------------- */}
          <div className={`info-block w-full pb-20 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
             <h2 className="text-2xl md:text-[28px] text-[#d6b785] mb-6">Additional Information</h2>
             
             {lawyer && (
               <div className="bg-[#d6b785] rounded-[24px] p-6 md:p-8 text-[#0f1e3f] font-sans grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                 <div className="col-span-1">
                   <div className="font-bold mb-1">Specialisations: <span className="font-normal opacity-90">{lawyer.specialisations?.join(', ') || 'General Practice'}</span></div>
                   <div className="font-bold">Fee Range: <span className="font-normal opacity-90">₹{lawyer.fee_min?.toLocaleString() || 'N/A'} – ₹{lawyer.fee_max?.toLocaleString() || 'N/A'} per case</span></div>
                 </div>
                 <div className="col-span-1">
                   {/* We don't have a negotiable DB field currently, safely omitting or hardcoding */}
                   <div className="font-bold mb-1">Response Time: <span className="font-normal opacity-90">Usually within {lawyer.response_time_hours || 24} hours</span></div>
                   <div className="font-bold">Practice Location: <span className="font-normal opacity-90">{lawyer.practice_district}, {lawyer.practice_state}</span></div>
                 </div>
               </div>
             )}
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(214, 183, 133, 0.2);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(214, 183, 133, 0.4);
        }
      `}} />
    </div>
  );
}
