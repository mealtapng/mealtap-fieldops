import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { validatePinFormat, hashPin } from '@/lib/auth/pin'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  // ── 1. Auth — caller must be admin ────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { agentId?: unknown; pin?: unknown }
  try { body = await request.json() } catch { return err('Invalid request body', 400) }

  const agentId = typeof body.agentId === 'string' ? body.agentId.trim() : ''
  const rawPin  = typeof body.pin     === 'string' ? body.pin.trim()     : ''

  if (!agentId) return err('agentId is required', 400)
  if (rawPin && !validatePinFormat(rawPin)) return err('PIN must be exactly 4 digits', 400)

  // ── 3. Generate PIN if not provided ───────────────────────────────────────
  const pin = rawPin || String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  // ── 4. Hash PIN ───────────────────────────────────────────────────────────
  const pinHash = await hashPin(pin)

  // ── 5. Update users table (service role to bypass RLS) ───────────────────
  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await (admin as any)
    .from('users')
    .update({ pin_hash: pinHash, failed_attempts: 0 })
    .eq('id', agentId)

  if (error) {
    console.error('[reset-pin] update error:', error.message)
    return err('Failed to reset PIN', 500)
  }

  // Return PIN once — admin must share it with the agent
  return NextResponse.json({ pin })
}
