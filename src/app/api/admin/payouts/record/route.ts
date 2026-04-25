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

  let body: { agentId?: unknown; netAmount?: unknown; hotLeads?: unknown; hotLeadBonus?: unknown; note?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const agentId      = typeof body.agentId      === 'string' ? body.agentId.trim() : null
  const netAmount    = Number(body.netAmount)
  const hotLeads     = Number(body.hotLeads    ?? 0)
  const hotLeadBonus = Number(body.hotLeadBonus ?? 0)
  const note         = typeof body.note === 'string' ? body.note.trim() : null

  if (!agentId)              return err('agentId is required', 400)
  if (!netAmount || netAmount <= 0) return err('netAmount must be positive', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now       = new Date()
  const weekStart = new Date(now)
  const dow = now.getUTCDay()
  weekStart.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  weekStart.setUTCHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7)

  const { data: payout, error: payoutError } = await (admin as any)
    .from('payouts')
    .insert({
      agent_id:              agentId,
      period_start:          weekStart.toISOString(),
      period_end:            weekEnd.toISOString(),
      total_captures:        0,
      total_hot_leads:       hotLeads,
      salary_amount:         netAmount - hotLeads * hotLeadBonus,
      hot_lead_bonus_amount: hotLeads * hotLeadBonus,
      deductions:            0,
      net_amount:            netAmount,
      status:                'paid',
      paid_at:               now.toISOString(),
      paid_by:               user.id,
      notes:                 note,
    })
    .select('id')
    .single()

  if (payoutError) {
    console.error('[payouts/record]', payoutError.message)
    return err('Failed to record payout', 500)
  }

  return NextResponse.json({ ok: true, payoutId: payout.id })
}
