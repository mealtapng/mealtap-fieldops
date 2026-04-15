import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Refreshes the user's Supabase session on every request.
 * Called from src/middleware.ts.
 *
 * The cookie dance here is required by @supabase/ssr:
 *  1. Read cookies from the incoming Request.
 *  2. After getUser() the SDK may issue updated tokens.
 *  3. Write those updated cookies onto both the Request (so subsequent
 *     server code in this request sees them) and the Response (so the
 *     browser stores the refreshed token).
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write onto the request so this request's server code sees fresh tokens.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response with the updated request cookies.
          supabaseResponse = NextResponse.next({ request })
          // Write onto the response so the browser stores the refreshed token.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This is the call that actually refreshes the session.
  // Do not remove it — without it, users get logged out randomly.
  // We also return the user so middleware.ts can make routing decisions
  // without a second network call.
  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
