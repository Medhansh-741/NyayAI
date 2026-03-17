import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null
  const error = searchParams.get('error')
  // ✅ Read role hint passed from Google OAuth redirect
  const roleHint = searchParams.get('role') === 'lawyer' ? 'lawyer' : 'citizen'

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options } as any)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options } as any)
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Check if role already exists (returning user)
      let { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

      // ✅ New Google user — insert as fallback (trigger + ON CONFLICT = safe)
      if (!roleData) {
        await supabase.from('user_roles').insert({ id: user.id, role: roleHint })

        if (roleHint === 'citizen') {
          await supabase.from('citizen_profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          })
        } else {
          await supabase.from('lawyer_profiles').insert({
            id: user.id,
            email: user.email ?? '',
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
          })
        }

        roleData = { role: roleHint }
      }

      if (roleData.role === 'lawyer') {
        return NextResponse.redirect(`${origin}/lawyerside/home`)
      }
      if (roleData.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      }
      return NextResponse.redirect(`${origin}/citizen/home`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
