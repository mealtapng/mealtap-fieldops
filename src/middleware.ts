import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js middleware — runs on every matched request before it reaches a page.
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth session (via updateSession).
 *  2. Enforce route-level auth and role-based access control.
 *
 * Route rules:
 *  /api/auth/*          → always public (login endpoint must be reachable)
 *  /login               → public; redirect to default page if already logged in
 *  /                    → redirect to /login (logged out) or default page (logged in)
 *  /dashboard, /capture, /messages, /profile (+ sub-paths)
 *                       → require auth; admins redirected to /admin
 *  /admin (+ sub-paths) → require auth + role admin|field_lead; agents → /dashboard
 *  everything else      → pass through
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Role is stored in user_metadata at login time (set via updateUserById in
  // the login route handler) so we never need a DB query here.
  const role = (user?.user_metadata?.role ?? '') as string

  /** Where a given role should land after login or on an access violation. */
  const defaultPage = () => (role === 'admin' ? '/admin' : '/dashboard')

  // ── Always public ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/auth/')) return response

  // ── /login — bounce logged-in users to their home ─────────────────────────
  if (pathname === '/login') {
    return user
      ? NextResponse.redirect(new URL(defaultPage(), request.url))
      : response
  }

  // ── Not authenticated — send to /login ────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Root — redirect to role-based home ────────────────────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(new URL(defaultPage(), request.url))
  }

  // ── Admin routes (/admin, /admin/*) ───────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (role !== 'admin' && role !== 'field_lead') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // ── Agent routes (/dashboard, /capture, /messages, /profile) ──────────────
  const agentRoots = ['/dashboard', '/capture', '/messages', '/profile']
  if (agentRoots.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     *  - _next/static  (built assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - common image extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
