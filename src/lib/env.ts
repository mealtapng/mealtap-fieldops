// This file is SERVER-ONLY. It holds the Supabase service role key.
// Importing it from a client component ('use client') will throw a build error.
import 'server-only'

/**
 * Validated, typed environment variable exports.
 *
 * Import from here in Server Components, Route Handlers, and Server Actions
 * instead of accessing process.env directly.
 *
 * Client components: use process.env.NEXT_PUBLIC_* directly — those vars are
 * already embedded in the browser bundle by Next.js at build time.
 *
 * Validation runs at module-import time. A missing variable throws immediately
 * on the first server request with a clear message naming the missing var.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Check your .env.local file. See .env.local.example for the full list.`
    )
  }
  return value
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

/** Supabase project URL — safe for browser use (NEXT_PUBLIC_) */
export const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')

/** Supabase anon key — safe for browser use (NEXT_PUBLIC_) */
export const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

/**
 * Supabase service role key — bypasses ALL RLS policies.
 * SERVER-SIDE ONLY. Never use in client components or NEXT_PUBLIC_ vars.
 */
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

// ---------------------------------------------------------------------------
// Mapbox
// ---------------------------------------------------------------------------

/** Mapbox public access token — safe for browser use (NEXT_PUBLIC_) */
export const MAPBOX_TOKEN = requireEnv('NEXT_PUBLIC_MAPBOX_TOKEN')

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/** Canonical app URL — e.g. http://localhost:3000 or https://field.powerchat.ng */
export const APP_URL = requireEnv('NEXT_PUBLIC_APP_URL')
