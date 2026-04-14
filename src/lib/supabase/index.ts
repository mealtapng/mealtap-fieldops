/**
 * Supabase client helpers — re-exported for cleaner imports.
 *
 * Usage:
 *   Client component:  import { createBrowserClient } from '@/lib/supabase'
 *   Server component:  import { createServerClient } from '@/lib/supabase'
 */
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
