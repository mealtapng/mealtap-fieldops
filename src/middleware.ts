import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Route rules:
 *  /api/auth/*        → always public
 *  /login             → public; redirect to home if already logged in
 *  /                  → redirect to role-based home
 *  /content-hub/*     → admin + content_manager only
 *  /admin/*           → admin + field_lead only
 *  /dashboard, etc.   → agent + field_lead only (admin → /admin, content_manager → /content-hub)
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const role = (user?.user_metadata?.role ?? '') as string

  function defaultPage() {
    if (role === 'admin')           return '/admin'
    if (role === 'content_manager') return '/content-hub'
    return '/dashboard'
  }

  // ── Always public ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/auth/')) return response

  // ── /login ─────────────────────────────────────────────────────────────────
  if (pathname === '/login') {
    return user
      ? NextResponse.redirect(new URL(defaultPage(), request.url))
      : response
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Root ───────────────────────────────────────────────────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(new URL(defaultPage(), request.url))
  }

  // ── Content Hub routes ─────────────────────────────────────────────────────
  if (pathname === '/content-hub' || pathname.startsWith('/content-hub/')) {
    if (role !== 'admin' && role !== 'content_manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (role === 'content_manager') {
      return NextResponse.redirect(new URL('/content-hub', request.url))
    }
    if (role !== 'admin' && role !== 'field_lead') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // ── Agent routes (/dashboard, /capture, /messages, /profile, /zone, /onboardings) ──
  const agentRoots = ['/dashboard', '/capture', '/messages', '/profile', '/zone', '/onboardings']
  if (agentRoots.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'content_manager') {
      return NextResponse.redirect(new URL('/content-hub', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
