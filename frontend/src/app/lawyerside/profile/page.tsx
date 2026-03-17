'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BadgeCheck, Mail, MapPin, Phone, SquarePen, Menu, Home, Compass, Store, Gavel } from 'lucide-react'
import { Sidebar } from '../../../../components/sidebar'
import type { NavItem } from '../../../../components/sidebar'
import type { Database } from '@/types/supabase'
import { supabase } from '@/lib/supabase/client'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

type LawyerProfile = Database['public']['Tables']['lawyer_profiles']['Row']
type LawyerOutcome = Database['public']['Enums']['case_outcome']

type LoadState = 'checking' | 'loading' | 'ready' | 'error'

const SECTION_LABELS: Record<string, string> = {
  full_name: 'Full name',
  professional_title: 'Professional title',
  bio: 'About section',
  practice_state: 'Practice state',
  practice_district: 'Practice district',
  bar_council_id: 'Bar Council ID',
  enrollment_number: 'Enrollment number',
  state_bar_council: 'State Bar Council',
  phone: 'Phone number',
  email: 'Email address',
  specialisations: 'Specialisations',
  languages: 'Languages',
  fee_min: 'Minimum fee',
  fee_max: 'Maximum fee',
}

function formatText(value: string | null | undefined, fallback = 'Not provided') {
  if (!value || value.trim().length === 0) return fallback
  return value
}

function formatTitle(value: string | null | undefined) {
  if (!value || value.trim().length === 0) return 'Not specified'
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const LAWYER_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/lawyerside/home' },
  { id: 'explorer', icon: Compass, label: 'Explorer', href: '/lawyerside/explorer' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/lawyerside/marketplace' },
  { id: 'my-cases', icon: Gavel, label: 'My Cases', href: '/lawyerside/my-cases' },
]

function formatCurrency(value: number | null | undefined, fallback = 'Not set') {
  if (value === null || value === undefined) return fallback
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A'
  return `${Math.round(value)}%`
}

function formatRating(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A'
  return value.toFixed(1)
}

function buildMissingFields(profile: LawyerProfile) {
  const checks: Array<[keyof typeof SECTION_LABELS, boolean]> = [
    ['full_name', !!profile.full_name?.trim()],
    ['professional_title', !!profile.professional_title?.trim()],
    ['bio', !!profile.bio?.trim()],
    ['practice_state', !!profile.practice_state?.trim()],
    ['practice_district', !!profile.practice_district?.trim()],
    ['bar_council_id', !!profile.bar_council_id?.trim()],
    ['enrollment_number', !!profile.enrollment_number?.trim()],
    ['state_bar_council', !!profile.state_bar_council?.trim()],
    ['phone', !!profile.phone?.trim()],
    ['email', !!profile.email?.trim()],
    ['specialisations', (profile.specialisations?.length ?? 0) > 0],
    ['languages', (profile.languages?.length ?? 0) > 0],
    ['fee_min', profile.fee_min !== null],
    ['fee_max', profile.fee_max !== null],
  ]

  return checks.filter(([, ok]) => !ok).map(([key]) => SECTION_LABELS[key])
}

function getOutcomeWinRate(outcomes: Array<{ outcome: LawyerOutcome }> | null) {
  if (!outcomes || outcomes.length === 0) return null
  const favorable = outcomes.filter(
    (entry) => entry.outcome === 'won' || entry.outcome === 'settled'
  ).length
  return (favorable / outcomes.length) * 100
}

type SwitchProps = {
  label: string
  active: boolean
  className?: string
}

function StaticSwitch({ label, active, className }: SwitchProps) {
  const onHover = (event: MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, { scale: 1.03, duration: 0.22, ease: 'power2.out' })
  }

  const onLeave = (event: MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, { scale: 1, duration: 0.22, ease: 'power2.out' })
  }

  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <p className="text-[15px] leading-6 text-[#483c31] dark:text-white md:text-base">{label}</p>
      <div
        className="h-7 w-12 rounded-full border border-[#d2c6b5] bg-[#d9cebf] p-[3px] cursor-default"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <div
          className={`h-5 w-5 rounded-full transition-transform duration-300 ${
            active ? 'translate-x-5 bg-[#8f6f3f]' : 'translate-x-0 bg-[#b8aa95]'
          }`}
        />
      </div>
    </div>
  )
}

export default function LawyerSelfProfilePage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const winRateRef = useRef<HTMLSpanElement>(null)
  const casesRef = useRef<HTMLSpanElement>(null)
  const ratingRef = useRef<HTMLSpanElement>(null)
  const yearsRef = useRef<HTMLSpanElement>(null)
  const completenessRef = useRef<HTMLSpanElement>(null)

  const [loadState, setLoadState] = useState<LoadState>('checking')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [outcomes, setOutcomes] = useState<Array<{ outcome: LawyerOutcome }> | null>(null)
  const [reviews, setReviews] = useState<Array<{ rating: number }> | null>(null)

  const handleProfileClick = () => {
    router.push('/lawyerside/profile')
  }

  useEffect(() => {
    let isMounted = true

    async function fetchProfileData() {
      setLoadState('checking')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !user) {
        router.replace('/login')
        return
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!isMounted) return

      if (roleData?.role && roleData.role !== 'lawyer' && roleData.role !== 'admin') {
        router.replace('/citizen/home')
        return
      }

      setLoadState('loading')

      const [{ data: profileData, error: profileError }, { data: outcomesData }, { data: reviewsData }] =
        await Promise.all([
          supabase.from('lawyer_profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('lawyer_case_history').select('outcome').eq('lawyer_id', user.id),
          supabase.from('lawyer_reviews').select('rating').eq('lawyer_id', user.id),
        ])

      if (!isMounted) return

      if (profileError) {
        setErrorMsg('We could not load your profile at this moment. Please try again from your dashboard.')
        setLoadState('error')
        return
      }

      if (!profileData) {
        setErrorMsg('Your account exists, but your lawyer profile record is missing. Complete onboarding to continue.')
        setLoadState('error')
        return
      }

      setProfile(profileData)
      setOutcomes((outcomesData as Array<{ outcome: LawyerOutcome }> | null) ?? null)
      setReviews((reviewsData as Array<{ rating: number }> | null) ?? null)
      setLoadState('ready')
    }

    fetchProfileData()

    return () => {
      isMounted = false
    }
  }, [router])

  const derived = useMemo(() => {
    if (!profile) return null

    const reviewAverage =
      reviews && reviews.length > 0 ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : null

    const derivedWinRate = getOutcomeWinRate(outcomes)
    const winRate = profile.win_rate ?? derivedWinRate
    const avgRating = profile.avg_rating ?? reviewAverage
    const totalCases = profile.total_cases ?? outcomes?.length ?? 0
    const missingFields = buildMissingFields(profile)
    const derivedCompleteness = Math.max(0, Math.min(100, Math.round(((14 - missingFields.length) / 14) * 100)))
    const completeness = profile.completeness_score ?? derivedCompleteness
    const shouldPromptCompletion = missingFields.length > 0
    const specialisations = (profile.specialisations ?? []).map((entry) => formatTitle(entry))

    return {
      winRate,
      avgRating,
      totalCases,
      missingFields,
      completeness,
      shouldPromptCompletion,
      specialisations,
    }
  }, [outcomes, profile, reviews])

  useGSAP(
    () => {
      if (loadState !== 'ready' || !profile || !derived || !containerRef.current) return

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      introTl
        .from('.js-topbar', { y: -18, opacity: 0, duration: 0.45 })
        .from('.js-hero-left', { y: 26, opacity: 0, duration: 0.52 }, '-=0.2')
        .from('.js-hero-right', { y: 26, opacity: 0, duration: 0.52 }, '-=0.34')
        .from('.js-stat-card', { y: 20, opacity: 0, duration: 0.44, stagger: 0.09 }, '-=0.2')
        .from('.js-side-section', { y: 20, opacity: 0, duration: 0.42, stagger: 0.08 }, '-=0.3')

      gsap.from('.js-chip', {
        y: 14,
        opacity: 0,
        duration: 0.36,
        stagger: 0.06,
        scrollTrigger: {
          trigger: '.js-chip-zone',
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })

      gsap.from('.js-credential-row', {
        y: 16,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        scrollTrigger: {
          trigger: '.js-credentials',
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })

      gsap.from('.js-reveal-left', {
        y: 28,
        opacity: 0,
        duration: 0.54,
        scrollTrigger: {
          trigger: '.js-reveal-left',
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      })

      gsap.from('.js-reveal-right', {
        y: 28,
        opacity: 0,
        duration: 0.54,
        scrollTrigger: {
          trigger: '.js-reveal-right',
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      })

      const counters: Array<{
        el: HTMLSpanElement | null
        target: number | null
        formatter: (value: number) => string
      }> = [
        {
          el: winRateRef.current,
          target: derived.winRate,
          formatter: (value) => `${Math.round(value)}%`,
        },
        {
          el: casesRef.current,
          target: derived.totalCases,
          formatter: (value) => `${Math.round(value)}`,
        },
        {
          el: ratingRef.current,
          target: derived.avgRating,
          formatter: (value) => value.toFixed(1),
        },
        {
          el: yearsRef.current,
          target: profile.experience_years,
          formatter: (value) => `${Math.round(value)}`,
        },
        {
          el: completenessRef.current,
          target: derived.completeness,
          formatter: (value) => `${Math.round(value)}%`,
        },
      ]

      counters.forEach(({ el, target, formatter }) => {
        if (!el || target === null || target === undefined) return
        const proxy = { value: 0 }
        gsap.to(proxy, {
          value: target,
          duration: 1.15,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = formatter(proxy.value)
          },
        })
      })
    },
    { scope: containerRef, dependencies: [derived, loadState, profile] }
  )

  const onScaleIn = (event: MouseEvent<HTMLElement>) => {
    gsap.to(event.currentTarget, { y: -1, scale: 1.02, duration: 0.2, ease: 'power2.out' })
  }

  const onScaleOut = (event: MouseEvent<HTMLElement>) => {
    gsap.to(event.currentTarget, { y: 0, scale: 1, duration: 0.2, ease: 'power2.out' })
  }

  if (loadState === 'checking' || loadState === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
          <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-full w-full">
          <main className="flex items-center justify-center px-6 py-6 md:py-10 h-full">
            <div className="w-full max-w-2xl rounded-[26px] border border-[#d9cebf] bg-[#f7f2e9] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8b6f4f]">Legal Rights Explorer</p>
              <div className="mt-5 animate-pulse space-y-4">
                <div className="h-11 w-2/3 rounded bg-[#e7dece]" />
                <div className="h-4 w-5/6 rounded bg-[#e7dece]" />
                <div className="h-4 w-3/4 rounded bg-[#e7dece]" />
                <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
                  <div className="h-20 rounded bg-[#e7dece]" />
                  <div className="h-20 rounded bg-[#e7dece]" />
                  <div className="h-20 rounded bg-[#e7dece]" />
                  <div className="h-20 rounded bg-[#e7dece]" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
          <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-full w-full">
          <main className="flex items-center justify-center px-6 py-6 md:py-10 h-full">
            <div className="w-full max-w-xl rounded-[24px] border border-[#d9cebf] bg-[#f7f2e9] p-8">
              <h1 className="text-3xl font-serif text-[#2a2119]">Profile unavailable</h1>
              <p className="mt-3 text-[#5c4a3a]">{errorMsg}</p>
              <Link
                href="/lawyerside/home"
                className="inline-flex mt-6 rounded-lg border border-[#9d7f58] px-4 py-2 text-sm font-medium uppercase tracking-[0.11em] text-[#6f5438]"
              >
                Return to home
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!profile || !derived) return null

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1e3f] overflow-hidden" ref={containerRef}>
      {/* Sidebar */}
      <div className="shrink-0 h-screen z-50 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0a152e]">
        <Sidebar navItems={LAWYER_NAV_ITEMS} showProfileButton={true} onProfileClick={handleProfileClick} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full overflow-y-auto">
        <main className="bg-[#efeadf] dark:bg-[#0f1e3f] text-[#4b3d2f] dark:text-white/90 py-6 md:py-10">
          <div className="mx-auto w-full max-w-[1150px] border border-[#d6cbbb] dark:border-white/10 bg-[#f2ede3] dark:bg-[#0a152e]">
        <section className="js-topbar flex items-center justify-between border-b border-[#d8cdbc] dark:border-white/10 px-6 py-4 md:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8a6f4f] dark:text-[#cdaa80] md:text-[15px]">Legal Rights Explorer</p>
          <Link
            href="/lawyerside/profile/edit"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8ccbc] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#7c6145] hover:bg-[#ece4d7]"
            onMouseEnter={onScaleIn}
            onMouseLeave={onScaleOut}
          >
            <SquarePen className="h-4 w-4" />
            Edit Profile
          </Link>
        </section>

        <section className="grid grid-cols-1 border-b border-[#d8cdbc] md:grid-cols-2">
          <div className="js-hero-left border-b border-[#d8cdbc] px-6 py-8 md:border-b-0 md:border-r md:px-10 md:py-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a6f4f] md:text-xs">
              {formatTitle(profile.professional_title)} • {formatText(profile.state_bar_council)}
            </p>
            <h1 className="mt-4 text-[52px] leading-[0.95] font-serif font-semibold text-[#1f1711] dark:text-zinc-100 md:text-[72px]">
              {formatText(profile.full_name, 'Lawyer Profile')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#5a4a3c] dark:text-white/80 md:text-xl">
              {formatText(profile.bio, 'Add your professional summary to strengthen client trust.')}
            </p>
          </div>

          <div className="js-hero-right px-6 py-8 md:px-10 md:py-10">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#d3c7b8] bg-[#ece3d5] text-[33px] font-serif uppercase text-[#8b6f4f]">
                {profile.full_name
                  ?.split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('') || 'LP'}
              </div>
              <div className="space-y-2 text-[#5a4a3c]">
                <div className="flex items-center gap-3">
                  <span className="rounded-md border border-[#d2c5b4] bg-[#ece3d5] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#82674a]">
                    {profile.verification_status === 'verified' ? 'Verified' : formatTitle(profile.verification_status)}
                  </span>
                  {profile.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 text-[#8a6c45] text-[12px] uppercase tracking-[0.12em]">
                      <BadgeCheck className="h-4 w-4" /> Verified
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-2 text-sm md:text-base text-[#5a4a3c] dark:text-white/80">
                  <MapPin className="h-4 w-4" />
                  {formatText(profile.practice_district)}, {formatText(profile.practice_state)}
                </p>
                <p className="flex items-center gap-2 text-sm md:text-base text-[#5a4a3c] dark:text-white/80">
                  <Mail className="h-4 w-4" />
                  {formatText(profile.email)}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-[#d8cdbc] dark:border-white/10 pt-6 text-sm text-[#5a4a3c] dark:text-white/90 md:text-base">
              {profile.experience_years ?? 'N/A'} years of practice · {formatTitle(profile.primary_category)} ·{' '}
              {(profile.court_types?.length ?? 0) > 0 ? profile.court_types?.join(' · ') : 'Courts not specified'}
            </div>
          </div>
        </section>
        <section className="grid grid-cols-2 border-b border-[#d8cdbc] dark:border-white/10 md:grid-cols-4">
          <article className="js-stat-card border-r border-[#d8cdbc] dark:border-white/10 px-6 py-5 text-center">
            <p className="text-5xl font-serif text-[#241b13] dark:text-zinc-100 md:text-[52px]">
              <span ref={winRateRef}>{formatPercent(derived.winRate)}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#7f6549] dark:text-[#cdaa80]">Win Rate</p>
          </article>
          <article className="js-stat-card border-r border-[#d8cdbc] dark:border-white/10 px-6 py-5 text-center">
            <p className="text-5xl font-serif text-[#241b13] dark:text-zinc-100 md:text-[52px]">
              <span ref={casesRef}>{derived.totalCases}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#7f6549] dark:text-[#cdaa80]">Cases</p>
          </article>
          <article className="js-stat-card border-t border-r border-[#d8cdbc] dark:border-white/10 px-6 py-5 text-center md:border-t-0">
            <p className="text-5xl font-serif text-[#241b13] dark:text-zinc-100 md:text-[52px]">
              <span ref={ratingRef}>{formatRating(derived.avgRating)}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#7f6549] dark:text-[#cdaa80]">Rating</p>
          </article>
          <article className="js-stat-card border-t border-[#d8cdbc] dark:border-white/10 px-6 py-5 text-center md:border-t-0">
            <p className="text-5xl font-serif text-[#241b13] dark:text-zinc-100 md:text-[52px]">
              <span ref={yearsRef}>{profile.experience_years ?? 'N/A'}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#7f6549] dark:text-[#cdaa80]">Years</p>
          </article>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
          <div className="js-reveal-left border-b border-[#d8cdbc] px-6 py-8 md:border-b-0 md:border-r md:px-10 md:py-9">
            <section>
              <h2 className="text-xs uppercase tracking-[0.28em] text-[#786049] dark:text-[#cdaa80]">About</h2>
              <p className="mt-5 max-w-4xl text-xl leading-relaxed italic text-[#2f261f] dark:text-white/90 md:text-[30px]">
                "{formatText(profile.bio, 'Add your about section to highlight your legal strengths.')}"
              </p>
            </section>

            <section className="js-chip-zone mt-10 border-t border-[#d8cdbc] pt-8">
              <h2 className="text-xs uppercase tracking-[0.28em] text-[#786049]">Specialisations</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {derived.specialisations.length > 0 ? (
                  derived.specialisations.map((entry) => (
                    <span
                      key={entry}
                      className="js-chip rounded border border-[#d4c8b8] bg-[#ece3d5] px-3 py-1 text-sm text-[#715b44] cursor-default"
                      onMouseEnter={onScaleIn}
                      onMouseLeave={onScaleOut}
                    >
                      {entry}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-[#7f6b56]">No specialisations added yet.</p>
                )}
              </div>
            </section>

            <section className="js-credentials mt-10 border-t border-[#d8cdbc] pt-8">
              <h2 className="text-xs uppercase tracking-[0.28em] text-[#786049]">Credentials</h2>
              <dl className="mt-6 grid grid-cols-1 gap-y-4 text-[#392f26] md:grid-cols-[1fr_auto] md:gap-x-8">
                <dt className="js-credential-row text-sm text-[#6f5b47] dark:text-white/60 md:text-base">Bar Council ID</dt>
                <dd className="js-credential-row text-sm text-[#392f26] dark:text-white/90 md:text-base">{formatText(profile.bar_council_id)}</dd>
                <dt className="js-credential-row text-sm text-[#6f5b47] dark:text-white/60 md:text-base">Enrollment</dt>
                <dd className="js-credential-row text-sm text-[#392f26] dark:text-white/90 md:text-base">{formatText(profile.enrollment_number)}</dd>
                <dt className="js-credential-row text-sm text-[#6f5b47] dark:text-white/60 md:text-base">State Bar Council</dt>
                <dd className="js-credential-row text-sm text-[#392f26] dark:text-white/90 md:text-base">{formatText(profile.state_bar_council)}</dd>
                <dt className="js-credential-row text-sm text-[#6f5b47] dark:text-white/60 md:text-base">Courts</dt>
                <dd className="js-credential-row text-sm text-[#392f26] dark:text-white/90 md:text-base">
                  {(profile.court_types?.length ?? 0) > 0 ? profile.court_types?.join(' · ') : 'Not provided'}
                </dd>
                <dt className="js-credential-row text-sm text-[#6f5b47] dark:text-white/60 md:text-base">Languages</dt>
                <dd className="js-credential-row text-sm text-[#392f26] dark:text-white/90 md:text-base">
                  {(profile.languages?.length ?? 0) > 0 ? profile.languages?.join(' · ') : 'Not provided'}
                </dd>
              </dl>
            </section>
          </div>

          <aside className="js-reveal-right px-6 py-8 md:px-8 md:py-9">
            <section className="js-side-section">
              <h3 className="text-xs uppercase tracking-[0.28em] text-[#786049]">Availability</h3>
              <div className="mt-5 space-y-4">
                <StaticSwitch label="Available for cases" active={!!profile.is_available} />
                <StaticSwitch label="Active profile" active={!!profile.is_active} />
              </div>
            </section>

            <section className="js-side-section mt-8 border-t border-[#d8cdbc] dark:border-white/10 pt-7">
              <h3 className="text-xs uppercase tracking-[0.28em] text-[#786049] dark:text-[#cdaa80]">Consultation Fee</h3>
              <p className="mt-4 text-[59px] leading-[1.1] font-serif text-[#231a12] dark:text-zinc-100">
                {formatCurrency(profile.fee_min)}
                <br />
                {formatCurrency(profile.fee_max)}
              </p>
              <p className="mt-2 text-sm text-[#705a43] dark:text-white/60">per consultation · INR</p>
            </section>

            <section className="js-side-section mt-8 border-t border-[#d8cdbc] dark:border-white/10 pt-7">
              <h3 className="text-xs uppercase tracking-[0.28em] text-[#786049] dark:text-[#cdaa80]">Response Time</h3>
              <p className="mt-4 text-[59px] leading-none font-serif text-[#231a12] dark:text-zinc-100">
                {profile.response_time_hours ?? 'N/A'}
                <span className="ml-2 text-[31px]">hrs</span>
              </p>
              <p className="mt-2 text-sm text-[#705a43] dark:text-white/60">typical response</p>
            </section>

            <section className="js-side-section mt-8 border-t border-[#d8cdbc] pt-7">
              <h3 className="text-xs uppercase tracking-[0.28em] text-[#786049]">Contact</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#4c4033]">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#8a6f4f]" />
                  {formatText(profile.email)}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#8a6f4f]" />
                  {formatText(profile.phone)}
                </li>
              </ul>
            </section>

            <section className="js-side-section mt-8 border-t border-[#d8cdbc] dark:border-white/10 pt-7">
              <h3 className="text-xs uppercase tracking-[0.28em] text-[#786049] dark:text-[#cdaa80]">Profile Completeness</h3>
              <p className="mt-4 text-[59px] leading-none font-serif text-[#231a12] dark:text-zinc-100">
                <span ref={completenessRef}>{derived.completeness}%</span>
                <span className="ml-2 text-[31px]">complete</span>
              </p>
              {derived.shouldPromptCompletion ? (
                <div className="mt-4 rounded-md border border-[#d8ccbc] bg-[#ece3d5] p-3 text-sm text-[#6e593f]">
                  Missing: {derived.missingFields.slice(0, 3).join(', ')}
                  {derived.missingFields.length > 3 ? ` and ${derived.missingFields.length - 3} more.` : '.'}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#6e593f]">All core profile sections are complete.</p>
              )}
            </section>
          </aside>
        </section>
          </div>
        </main>
      </div>
    </div>
  )
}
