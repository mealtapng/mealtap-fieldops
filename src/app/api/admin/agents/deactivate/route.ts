import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: { agentId?: unknown }
  try {
    body = await request.json()
  } catch {
    return err('Invalid request body', 400)
  }

  const agentId = typeof body.agentId === 'string' ? body.agentId : null
  if (!agentId) return err('agentId is required', 400)

  // ── 3. Deactivate ────────────────────────────────────────────────────────
  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await (admin as any)
    .from('users')
    .update({ is_active: false })
    .eq('id', agentId)

  if (error) {
    console.error('[agents/deactivate] update error:', error.message)
    return err('Failed to deactivate agent', 500)
  }

  return NextResponse.json({ success: true })
}
