'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { Sidebar } from '../../../../components/sidebar';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type LawyerProfile = Database['public']['Tables']['lawyer_profiles']['Row'];

// ── Domain label formatter ─────────────────────────────────
const DOMAIN_LABELS: Record<string, string> = {
  criminal:              'Criminal Law',
  family:                'Family Law',
  divorce:               'Divorce',
  property:              'Property Law',
  consumer:              'Consumer Disputes',
  cyber:                 'Cyber Crime',
  labour:                'Labour & Employment',
  tax:                   'Tax Law',
  corporate:             'Corporate / Business',
  intellectual_property: 'Intellectual Property',
  constitutional:        'Constitutional / PIL',
  civil:                 'Civil Law',
  tenant:                'Tenant / Rent',
  rti:                   'RTI',
  corruption:            'Anti-Corruption',
  other:                 'General Practice',
}

function formatDomain(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain.replace(/_/g, ' ')
}

function formatResponseTime(hours: number | null): string {
  if (!hours || hours <= 1)  return 'Responds within 1 hour'
  if (hours <= 24)           return `Responds within ${hours} hours`
  const days = Math.ceil(hours / 24)
  return `Responds within ${days} day${days > 1 ? 's' : ''}`
}

function formatFeeRange(min: number | null, max: number | null): string {
  if (!min && !max) return 'Contact for pricing'
  if (min && !max)  return `From ₹${min.toLocaleString('en-IN')}`
  if (!min && max)  return `Up to ₹${max.toLocaleString('en-IN')}`
  return `₹${min!.toLocaleString('en-IN')} – ₹${max!.toLocaleString('en-IN')}`
}

export default function LawyerMarketplace() {
  const [allLawyers, setAllLawyers]   = useState<LawyerProfile[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [dbError, setDbError]         = useState<string | null>(null)
  const [selectedPriceIndex, setSelectedPriceIndex] = useState<number>(2)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const allPriceLabels = [
    '₹0','₹10k','₹20k','₹30k','₹40k','₹50k','₹60k','₹70k','₹80k','₹90k',
    '₹1L','₹1.1L','₹1.2L','₹1.3L','₹1.4L','₹1.5L','₹1.6L','₹1.7L','₹1.8L','₹1.9L','₹2L+'
  ]

  const parsePrice = (priceStr: string) => {
    if (!priceStr || priceStr === '₹0') return 0
    if (priceStr.includes('k'))  return parseInt(priceStr.replace('₹','').replace('k','')) * 1000
    if (priceStr.includes('L+')) return parseInt(priceStr.replace('₹','').replace('L+','')) * 100000
    if (priceStr.includes('L'))  return parseFloat(priceStr.replace('₹','').replace('L','')) * 100000
    return 0
  }

  const [isLawTypeOpen, setIsLawTypeOpen]         = useState(false)
  const [selectedLawType, setSelectedLawType]     = useState('Law Type')
  const dropdownRef                               = useRef<HTMLDivElement>(null)
  const dropdownContentRef                        = useRef<HTMLDivElement>(null)

  const [isExperienceOpen, setIsExperienceOpen]   = useState(false)
  const [selectedExperience, setSelectedExperience] = useState('Years in Practice')
  const expDropdownRef                            = useRef<HTMLDivElement>(null)
  const expDropdownContentRef                     = useRef<HTMLDivElement>(null)

  const experienceOptions = useMemo(() => [
    { label: "0 – 2 years (Junior Advocate)",        min: 0,  max: 2   },
    { label: "3 – 5 years (Early Career)",            min: 3,  max: 5   },
    { label: "6 – 10 years (Mid-Level Advocate)",     min: 6,  max: 10  },
    { label: "11 – 15 years (Experienced Advocate)",  min: 11, max: 15  },
    { label: "16 – 20 years (Senior Advocate)",       min: 16, max: 20  },
    { label: "20+ years (Highly Experienced)",        min: 21, max: 100 }
  ], [])

  const lawTypes = useMemo(() => {
    let lawyers = allLawyers
    if (selectedExperience !== 'Years in Practice') {
      const option = experienceOptions.find(opt => opt.label === selectedExperience)
      if (option) {
        lawyers = lawyers.filter(l =>
          (l.experience_years ?? 0) >= option.min &&
          (l.experience_years ?? 0) <= option.max
        )
      }
    }
    const maxPrice = parsePrice(allPriceLabels[Math.min(selectedPriceIndex, allPriceLabels.length - 1)])
    lawyers = lawyers.filter(l => !l.fee_max || l.fee_max <= maxPrice)

    const types = new Set<string>()
    lawyers.forEach(lawyer => {
      lawyer.specialisations?.forEach(spec => types.add(spec))
    })
    return Array.from(types).sort()
  }, [allLawyers, selectedExperience, selectedPriceIndex])

  const experienceLabels = useMemo(() => {
    let lawyers = allLawyers
    if (selectedLawType !== 'Law Type') {
      lawyers = lawyers.filter(l =>
        l.specialisations?.includes(selectedLawType as any)
      )
    }
    const maxPrice = parsePrice(allPriceLabels[Math.min(selectedPriceIndex, allPriceLabels.length - 1)])
    lawyers = lawyers.filter(l => !l.fee_max || l.fee_max <= maxPrice)

    return experienceOptions
      .filter(opt => lawyers.some(l =>
        (l.experience_years ?? 0) >= opt.min &&
        (l.experience_years ?? 0) <= opt.max
      ))
      .map(opt => opt.label)
  }, [allLawyers, selectedLawType, selectedPriceIndex, experienceOptions])

  const priceOptions = useMemo(() => {
    let lawyers = allLawyers
    if (selectedLawType !== 'Law Type') {
      lawyers = lawyers.filter(l => l.specialisations?.includes(selectedLawType as any))
    }
    if (selectedExperience !== 'Years in Practice') {
      const option = experienceOptions.find(opt => opt.label === selectedExperience)
      if (option) {
        lawyers = lawyers.filter(l =>
          (l.experience_years ?? 0) >= option.min &&
          (l.experience_years ?? 0) <= option.max
        )
      }
    }
    if (lawyers.length === 0) return ['₹0']
    const maxDbFee = Math.max(...lawyers.map(l => l.fee_max ?? 0))
    let foundMax = false
    return allPriceLabels.filter(priceStr => {
      if (foundMax) return false
      if (parsePrice(priceStr) >= maxDbFee) { foundMax = true; return true }
      return true
    })
  }, [allLawyers, selectedLawType, selectedExperience, experienceOptions])

  useEffect(() => {
    if (priceOptions.length > 0 && selectedPriceIndex >= priceOptions.length) {
      setSelectedPriceIndex(priceOptions.length - 1)
    }
  }, [priceOptions])

  useEffect(() => {
    if (selectedExperience !== 'Years in Practice' &&
        experienceLabels.length > 0 &&
        !experienceLabels.includes(selectedExperience)) {
      setSelectedExperience('Years in Practice')
    }
  }, [experienceLabels])

  // ── Fetch + Realtime ───────────────────────────────────────
  const fetchLawyers = useCallback(async () => {
    setIsLoading(true)
    setDbError(null)

    const { data, error } = await supabase
      .from('lawyer_profiles')
      .select('*')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('avg_rating', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      setDbError(error.message)
    } else {
      setAllLawyers(data ?? [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchLawyers()

    const channel = supabase
      .channel('lawyer-marketplace-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lawyer_profiles' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchLawyers()
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => { void supabase.removeChannel(channel) }
  }, [fetchLawyers])

  // ── Filtering ──────────────────────────────────────────────
  const filteredLawyers = useMemo(() => {
    let result = [...allLawyers]

    if (selectedLawType !== 'Law Type') {
      result = result.filter(l => l.specialisations?.includes(selectedLawType as any))
    }

    if (selectedExperience !== 'Years in Practice') {
      const option = experienceOptions.find(opt => opt.label === selectedExperience)
      if (option) {
        result = result.filter(l =>
          (l.experience_years ?? 0) >= option.min &&
          (l.experience_years ?? 0) <= option.max
        )
      }
    }

    const activePriceIndex = Math.min(selectedPriceIndex, priceOptions.length - 1)
    const maxPrice = parsePrice(priceOptions[activePriceIndex] ?? '₹2L+')
    result = result.filter(l => !l.fee_max || l.fee_max <= maxPrice)

    return result
  }, [selectedLawType, selectedExperience, selectedPriceIndex, allLawyers, experienceOptions, priceOptions])

  // ── Click outside ──────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLawTypeOpen(false)
      }
      if (expDropdownRef.current && !expDropdownRef.current.contains(event.target as Node)) {
        setIsExperienceOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── GSAP Dropdowns ─────────────────────────────────────────
  useEffect(() => {
    if (!dropdownContentRef.current) return
    if (isLawTypeOpen) {
      gsap.fromTo(dropdownContentRef.current,
        { opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top center', display: 'none' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power2.out', display: 'block' }
      )
    } else {
      gsap.to(dropdownContentRef.current, {
        opacity: 0, y: -10, scaleY: 0.9, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          if (dropdownContentRef.current) dropdownContentRef.current.style.display = 'none'
        }
      })
    }
  }, [isLawTypeOpen])

  useEffect(() => {
    if (!expDropdownContentRef.current) return
    if (isExperienceOpen) {
      gsap.fromTo(expDropdownContentRef.current,
        { opacity: 0, y: -10, scaleY: 0.9, transformOrigin: 'top center', display: 'none' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power2.out', display: 'block' }
      )
    } else {
      gsap.to(expDropdownContentRef.current, {
        opacity: 0, y: -10, scaleY: 0.9, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          if (expDropdownContentRef.current) expDropdownContentRef.current.style.display = 'none'
        }
      })
    }
  }, [isExperienceOpen])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f1e3f]">
      <div className="md:sticky md:top-0 md:h-screen shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 max-w-[1200px] mx-auto p-6 md:p-10 text-gray-900 dark:text-white font-serif">

        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-medium tracking-wide text-[#997953] dark:text-[#cdaa80] mb-2 font-serif">
            Lawyer Marketplace
          </h1>
          <p className="text-gray-600 dark:text-white/70 text-[15px] font-sans">
            Browse verified lawyers matched to your legal case and consult them directly.
          </p>

          {/* DB Status indicator */}
          {!isLoading && (
            <div className={`mt-3 inline-flex items-center gap-2 text-xs font-sans px-3 py-1 rounded-full ${
              dbError
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dbError ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
              {dbError
                ? `DB Error: ${dbError}`
                : `${filteredLawyers.length} of ${allLawyers.length} lawyers shown`
              }
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 font-sans w-full relative z-40">

          {/* Law Type Dropdown */}
          <div className="relative z-50 shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsLawTypeOpen(!isLawTypeOpen)}
              className={`flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-56
                ${isLawTypeOpen ? 'bg-[#213a56] ring-1 ring-[#cdaa80]/50' : 'hover:bg-[#213a56]'}`}
            >
              <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-left text-sm truncate">{selectedLawType}</span>
              <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isLawTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              ref={dropdownContentRef}
              className="absolute top-full left-0 mt-2 w-56 bg-[#0f1e3f] border border-[#cdaa80]/30 rounded-lg shadow-2xl overflow-hidden"
              style={{ display: 'none' }}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                <button
                  onClick={() => { setSelectedLawType('Law Type'); setIsLawTypeOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedLawType === 'Law Type'
                      ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium'
                      : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'
                  }`}
                >
                  All Law Types
                </button>
                {lawTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { setSelectedLawType(type); setIsLawTypeOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedLawType === type
                        ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium'
                        : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'
                    }`}
                  >
                    {formatDomain(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Wheel */}
          <div className="relative w-full md:w-[420px] h-16 bg-[#0a152e] shrink-0 flex items-center justify-center overflow-hidden rounded-full border border-[#cdaa80]/20 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),_0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute left-0 w-24 h-full bg-gradient-to-r from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-l-full" />
            <div className="absolute right-0 w-24 h-full bg-gradient-to-l from-[#0a152e] via-[#0a152e]/80 to-transparent z-20 pointer-events-none rounded-r-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[46px] bg-[#cdaa80]/15 border border-[#cdaa80]/70 rounded-full z-10 pointer-events-none shadow-[0_0_20px_rgba(205,170,128,0.3)]" />
            <div
              className="absolute top-1/2 left-1/2 flex items-center transition-transform duration-500 ease-out z-10"
              style={{ transform: `translate(calc(-${selectedPriceIndex * 84 + 42}px), -50%)` }}
            >
              {priceOptions.map((price, idx) => {
                const dist    = Math.abs(idx - selectedPriceIndex)
                const isSelected = dist === 0
                return (
                  <div
                    key={price}
                    onClick={() => setSelectedPriceIndex(idx)}
                    className={`w-[84px] shrink-0 text-center cursor-pointer transition-all duration-300 font-serif tracking-wide text-[16px]
                      ${isSelected ? 'text-[#cdaa80] drop-shadow-[0_0_12px_rgba(205,170,128,1)]' : 'text-[#cdaa80]/50 hover:text-[#cdaa80]/80'}`}
                    style={{
                      transform: `scale(${isSelected ? 1.05 : Math.max(0.7, 1 - dist * 0.15)})`,
                      opacity: isSelected ? 1 : Math.max(0.15, 1 - dist * 0.25),
                    }}
                  >
                    {price}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Experience Dropdown */}
          <div className="relative z-50 shrink-0" ref={expDropdownRef}>
            <button
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
              className={`flex items-center gap-3 bg-[#0f1e3f] border border-[#cdaa80]/50 text-[#cdaa80] px-4 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#cdaa80]/30 outline-none w-64
                ${isExperienceOpen ? 'bg-[#213a56] ring-1 ring-[#cdaa80]/50' : 'hover:bg-[#213a56]'}`}
            >
              <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="flex-1 text-left text-sm truncate">{selectedExperience}</span>
              <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isExperienceOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              ref={expDropdownContentRef}
              className="absolute top-full left-0 mt-2 w-64 bg-[#0f1e3f] border border-[#cdaa80]/30 rounded-lg shadow-2xl overflow-hidden"
              style={{ display: 'none' }}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                <button
                  onClick={() => { setSelectedExperience('Years in Practice'); setIsExperienceOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedExperience === 'Years in Practice'
                      ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium'
                      : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'
                  }`}
                >
                  Any Experience
                </button>
                {experienceLabels.map(exp => (
                  <button
                    key={exp}
                    onClick={() => { setSelectedExperience(exp); setIsExperienceOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedExperience === exp
                        ? 'bg-[#cdaa80]/20 text-[#cdaa80] font-medium'
                        : 'text-white/80 hover:bg-[#213a56] hover:text-[#cdaa80]'
                    }`}
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#cdaa80]" />
            </div>
          ) : dbError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-400/30 rounded-xl">
              <p className="text-red-400 font-sans text-sm">Failed to load lawyers</p>
              <p className="text-red-400/60 font-mono text-xs mt-1">{dbError}</p>
              <button
                onClick={fetchLawyers}
                className="mt-4 px-4 py-2 bg-[#cdaa80]/20 text-[#cdaa80] rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : filteredLawyers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#cdaa80]/30 rounded-xl bg-[#0a152e]/50">
              <svg className="w-12 h-12 text-[#cdaa80]/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-xl font-serif text-[#cdaa80] mb-2">No advocates found</h3>
              <p className="text-white/60 font-sans max-w-md">
                Try adjusting your filters to find legal professionals matching your criteria.
              </p>
            </div>
          ) : (
            filteredLawyers.map(lawyer => {
              const primaryDomain = lawyer.specialisations?.[0] ?? 'other'
              const priceRange    = formatFeeRange(lawyer.fee_min, lawyer.fee_max)
              const responseTime  = formatResponseTime(lawyer.response_time_hours)

              return (
                <div
                  key={lawyer.id}
                  onMouseEnter={() => setHoveredCard(lawyer.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    bg-white dark:bg-[#cdaa80] text-[#0f1e3f] rounded-xl p-6 md:p-8
                    transition-all duration-300 ease-out cursor-pointer relative overflow-hidden
                    shadow-lg border border-gray-100 dark:border-transparent
                    ${hoveredCard === lawyer.id ? 'transform -translate-y-1 shadow-2xl brightness-105' : ''}
                  `}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f1e3f 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                  <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">

                    {/* Left */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <span className="inline-block px-1.5 py-0.5 bg-[#0f1e3f]/10 rounded text-[10px] font-bold tracking-wider font-sans text-[#0f1e3f]/70 uppercase">
                          {formatDomain(primaryDomain)}
                        </span>
                        <div className="md:hidden text-right font-sans mb-2">
                          <div className="text-lg font-bold font-serif">{priceRange}</div>
                        </div>
                      </div>

                      <h2 className="text-xl md:text-2xl font-medium tracking-tight">
                        <span className="font-semibold">
                          {lawyer.full_name?.includes('Adv.') ? lawyer.full_name : `Adv. ${lawyer.full_name}`}
                        </span>
                        {lawyer.experience_years ? ` — ${lawyer.experience_years} Years Exp.` : ''}
                      </h2>

                      <p className="text-[#0f1e3f]/80 text-[14px] leading-relaxed font-sans max-w-4xl pr-4 line-clamp-2">
                        {lawyer.bio ?? 'No description provided.'}
                      </p>

                      {/* Specialisations pills */}
                      {lawyer.specialisations && lawyer.specialisations.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {lawyer.specialisations.slice(1).map(spec => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 bg-[#0f1e3f]/10 rounded-full text-[10px] font-sans text-[#0f1e3f]/60"
                            >
                              {formatDomain(spec)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-4 flex items-center justify-between font-sans">
                        <div className="flex items-center gap-4 flex-wrap">
                          {lawyer.verification_status === 'verified' && (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-[#0f1e3f]/90">
                              <div className="bg-[#0f1e3f]/20 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px]">✓</div>
                              Verified Advocate
                            </div>
                          )}
                          {lawyer.avg_rating && (
                            <div className="flex items-center gap-1 text-sm text-[#0f1e3f]/70">
                              ⭐ {lawyer.avg_rating.toFixed(1)}
                            </div>
                          )}
                          {lawyer.practice_district && lawyer.practice_state && (
                            <div className="flex items-center gap-1 text-sm text-[#0f1e3f]/60 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {lawyer.practice_district}, {lawyer.practice_state}
                            </div>
                          )}
                        </div>
                        <button className={`md:hidden px-5 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 ${hoveredCard === lawyer.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}>
                          View Profile
                        </button>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="hidden md:flex flex-col items-end justify-between shrink-0 pl-6 border-l border-[#0f1e3f]/10">
                      <div className="text-right font-sans">
                        <div className="text-[17px] font-bold font-serif mb-1">{priceRange}</div>
                        <div className="flex items-center justify-end gap-1 text-[11px] text-[#0f1e3f]/70 whitespace-nowrap">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {responseTime}
                        </div>
                      </div>
                      <button className={`px-6 py-1.5 border border-[#0f1e3f]/30 rounded-lg text-sm font-medium font-sans transition-all duration-300 mt-4 ${hoveredCard === lawyer.id ? 'bg-[#0f1e3f] text-[#cdaa80]' : 'hover:bg-[#0f1e3f]/5'}`}>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #0f1e3f; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #213a56; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(205,170,128,0.5); }
        `}} />
      </div>
    </div>
  )
}
