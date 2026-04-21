import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  let body: { agentId?: unknown; amount?: unknown; note?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const agentId = typeof body.agentId === 'string' ? body.agentId.trim() : null
  const amount  = Number(body.amount)
  const note    = typeof body.note === 'string' ? body.note.trim() : null

  if (!agentId) return err('agentId is required', 400)
  if (!amount || amount <= 0) return err('amount must be positive', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await (admin as any)
    .from('payouts')
    .insert({ agent_id: agentId, amount, note, paid_by: user.id })

  if (error) {
    console.error('[payouts/record]', error.message)
    return err('Failed to record payout', 500)
  }

  return NextResponse.json({ ok: true })
}
