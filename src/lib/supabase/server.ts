import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

/**
 * Server-side Supabase client factory.
 * Use in Server Components, Route Handlers, and Server Actions.
 * Reads and writes session cookies via next/headers.
 *
 * The setAll try/catch is intentional: Server Components cannot set cookies,
 * so we swallow that error. Route Handlers and Server Actions will succeed.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — cookie writes are not allowed here.
            // Session refresh is handled by middleware.ts instead.
          }
        },
      },
    }
  )
}
