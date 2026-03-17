'use client'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Constants, type Database } from '@/types/supabase'

type LegalDomain = Database['public']['Enums']['legal_domain']

export type LawyerProfileEditable = {
  full_name: string
  professional_title: string
  email: string
  phone: string
  bio: string
  practice_state: string
  practice_district: string
  bar_council_id: string
  enrollment_number: string
  state_bar_council: string
  enrollment_year: string
  experience_years: string
  fee_min: string
  fee_max: string
  response_time_hours: string
  court_types: string
  languages: string
  specialisations: LegalDomain[]
  is_available: boolean
}

type Props = {
  userId: string
  initialProfile: LawyerProfileEditable
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export default function EditLawyerProfileForm({ userId, initialProfile }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<LawyerProfileEditable>(initialProfile)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      router.push('/lawyerside/profile')
    }
  }, [countdown, router])

  const completionPreview = useMemo(() => {
    const requiredChecks = [
      form.full_name.trim().length > 0,
      form.professional_title.trim().length > 0,
      form.bio.trim().length > 0,
      form.practice_state.trim().length > 0,
      form.practice_district.trim().length > 0,
      form.bar_council_id.trim().length > 0,
      form.enrollment_number.trim().length > 0,
      form.state_bar_council.trim().length > 0,
      form.phone.trim().length > 0,
      form.email.trim().length > 0,
      form.specialisations.length > 0,
      parseCsv(form.languages).length > 0,
      parseNumber(form.fee_min) !== null,
      parseNumber(form.fee_max) !== null,
    ]

    const complete = requiredChecks.filter(Boolean).length
    return Math.round((complete / requiredChecks.length) * 100)
  }, [form])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const feeMin = parseNumber(form.fee_min)
    const feeMax = parseNumber(form.fee_max)

    if (feeMin !== null && feeMax !== null && feeMin > feeMax) {
      setSaving(false)
      setErrorMsg('Minimum fee cannot be higher than maximum fee.')
      return
    }

    const payload: Database['public']['Tables']['lawyer_profiles']['Insert'] = {
      id: userId,
      full_name: form.full_name.trim() || undefined,
      professional_title: form.professional_title.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      practice_state: form.practice_state.trim() || null,
      practice_district: form.practice_district.trim() || null,
      bar_council_id: form.bar_council_id.trim() || null,
      enrollment_number: form.enrollment_number.trim() || null,
      state_bar_council: form.state_bar_council.trim() || null,
      enrollment_year: parseNumber(form.enrollment_year),
      experience_years: parseNumber(form.experience_years),
      fee_min: feeMin,
      fee_max: feeMax,
      response_time_hours: parseNumber(form.response_time_hours),
      court_types: parseCsv(form.court_types),
      languages: parseCsv(form.languages),
      specialisations: form.specialisations,
      is_available: form.is_available,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('lawyer_profiles')
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      setSaving(false)
      setErrorMsg(error.message)
      return
    }

    setSaving(false)
    setSuccessMsg('Profile updated successfully.')
    setCountdown(5)
    router.refresh()
  }

  const allDomains = Constants.public.Enums.legal_domain

  return (
    <main className="min-h-screen bg-[#f5f0e8] dark:bg-[#0f1e3f] text-[#443831] dark:text-white/90">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        <div className="rounded-3xl border border-[#d9cfbf] dark:border-white/10 bg-[#f8f3ea] dark:bg-[#0a152e]">
          <div className="flex items-center justify-between border-b border-[#ddd2c2] px-6 py-5 md:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#7f654a] dark:text-[#cdaa80]">Lawyer Profile</p>
              <h1 className="mt-2 text-2xl font-serif font-semibold text-[#2a2119] dark:text-white md:text-3xl">Edit profile details</h1>
            </div>
            <Link
              href="/lawyerside/profile"
              className="rounded-lg border border-[#cdbfae] dark:border-white/20 px-4 py-2 text-sm text-[#443831] dark:text-[#cdaa80] hover:bg-[#efe7da] dark:hover:bg-white/5 transition-colors"
            >
              Back to profile
            </Link>
          </div>

          <form onSubmit={onSubmit} className="space-y-8 px-6 py-7 md:px-8 md:py-9">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Full name</span>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Professional title</span>
                <input
                  value={form.professional_title}
                  onChange={(e) => setForm((prev) => ({ ...prev, professional_title: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
            </section>

            <section>
              <label className="space-y-1 block">
                <span className="text-sm text-[#705b45] dark:text-white/60">Bio</span>
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Practice state</span>
                <input
                  value={form.practice_state}
                  onChange={(e) => setForm((prev) => ({ ...prev, practice_state: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Practice district</span>
                <input
                  value={form.practice_district}
                  onChange={(e) => setForm((prev) => ({ ...prev, practice_district: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Bar Council ID</span>
                <input
                  value={form.bar_council_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, bar_council_id: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Enrollment number</span>
                <input
                  value={form.enrollment_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, enrollment_number: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">State Bar Council</span>
                <input
                  value={form.state_bar_council}
                  onChange={(e) => setForm((prev) => ({ ...prev, state_bar_council: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Enrollment year</span>
                <input
                  type="number"
                  value={form.enrollment_year}
                  onChange={(e) => setForm((prev) => ({ ...prev, enrollment_year: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Experience years</span>
                <input
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => setForm((prev) => ({ ...prev, experience_years: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Response time (hours)</span>
                <input
                  type="number"
                  value={form.response_time_hours}
                  onChange={(e) => setForm((prev) => ({ ...prev, response_time_hours: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Minimum fee (INR)</span>
                <input
                  type="number"
                  value={form.fee_min}
                  onChange={(e) => setForm((prev) => ({ ...prev, fee_min: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Maximum fee (INR)</span>
                <input
                  type="number"
                  value={form.fee_max}
                  onChange={(e) => setForm((prev) => ({ ...prev, fee_max: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                />
              </label>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Court types (comma separated)</span>
                <input
                  value={form.court_types}
                  onChange={(e) => setForm((prev) => ({ ...prev, court_types: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                  placeholder="High Court, District Court"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[#705b45] dark:text-white/60">Languages (comma separated)</span>
                <input
                  value={form.languages}
                  onChange={(e) => setForm((prev) => ({ ...prev, languages: e.target.value }))}
                  className="w-full rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2.5 outline-none focus:border-[#997953] dark:focus:border-[#cdaa80] text-[#2a2119] dark:text-white"
                  placeholder="Hindi, English"
                />
              </label>
            </section>

            <section>
              <span className="text-sm text-[#705b45] dark:text-white/60">Specialisations</span>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {allDomains.map((domain) => {
                  const checked = form.specialisations.includes(domain)
                  return (
                    <label
                      key={domain}
                      className="flex items-center gap-2 rounded-lg border border-[#d9cfbf] dark:border-white/10 bg-[#fffdfa] dark:bg-white/5 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            specialisations: e.target.checked
                              ? [...prev.specialisations, domain]
                              : prev.specialisations.filter((item) => item !== domain),
                          }))
                        }}
                      />
                      <span className="text-sm text-[#5a4838] dark:text-white/80">{domain.replaceAll('_', ' ')}</span>
                    </label>
                  )
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[#d9cfbf] dark:border-white/10 bg-[#f2eadf] dark:bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#5d4936] dark:text-white/60">Profile completion preview</p>
                <p className="text-2xl font-serif text-[#2a2119] dark:text-white">{completionPreview}%</p>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#5d4936] dark:text-white/80">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                />
                Available for new cases
              </label>
            </section>

            {errorMsg && <p className="rounded-lg bg-red-100 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50">{errorMsg}</p>}
            {successMsg && (
              <p className="rounded-lg bg-green-100 dark:bg-green-950/30 px-3 py-2 text-sm text-green-700 dark:text-green-400 border border-transparent dark:border-green-800/50">
                {successMsg} {countdown !== null && `Redirecting in ${countdown} seconds...`}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#997953] dark:bg-[#cdaa80] px-5 py-2.5 text-sm font-medium text-[#f8f3ea] dark:text-[#0a152e] hover:bg-[#7f654a] dark:hover:bg-[#e0c3a0] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <Link
                href="/lawyerside/profile"
                className="rounded-lg border border-[#cdbfae] dark:border-white/20 px-5 py-2.5 text-sm text-[#443831] dark:text-[#cdaa80] hover:bg-[#efe7da] dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
