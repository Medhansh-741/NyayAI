import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ✅ getUser() validates the JWT with Supabase servers — cannot be spoofed
  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  const isProtectedRoute =
    pathname.startsWith('/citizen') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/intake') ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/case')

  const isAuthRoute = pathname === '/login' || pathname === '/register'

  // 1. No user → block all protected routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2. Logged in → redirect away from login/register
  if (user && isAuthRoute) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = roleData?.role ?? 'citizen'
    const dest = role === 'lawyer' ? '/portal/dashboard' : '/citizen/home'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // 3. Role-based route protection
  if (user && isProtectedRoute) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = roleData?.role ?? 'citizen'

    // Citizen trying to access lawyer portal
    if (pathname.startsWith('/portal') && role !== 'lawyer' && role !== 'admin') {
      return NextResponse.redirect(new URL('/citizen/home', req.url))
    }

    // Lawyer trying to access citizen area
    if (pathname.startsWith('/citizen') && role !== 'citizen' && role !== 'admin') {
      return NextResponse.redirect(new URL('/portal/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}