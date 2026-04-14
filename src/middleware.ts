import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js middleware — runs on every matched request before it reaches a page.
 * Currently only refreshes the Supabase auth session.
 * Route protection (redirect unauthenticated users to /login) is added in task B3.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
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
