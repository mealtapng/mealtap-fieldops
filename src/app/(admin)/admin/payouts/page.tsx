import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { PayoutsView } from '@/components/admin/PayoutsView'

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date()
  const dow = now.getUTCDay()
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  weekStart.setUTCHours(0, 0, 0, 0)
  const weekISO = weekStart.toISOString()

  const [agentsResult, capturesResult, payoutsResult, settingsResult, zonesResult] = await Promise.all([
    (admin as any).from('users').select('id, full_name, employee_id, assigned_zone_id, is_active, bank_name, bank_account_masked').in('role', ['agent', 'field_lead']).order('full_name'),
    (admin as any).from('restaurants').select('captured_by, tag').gte('created_at', weekISO),
    (admin as any).from('payouts').select('agent_id, net_amount, status, paid_at').order('created_at', { ascending: false }),
    (admin as any).from('app_settings').select('key, value').in('key', ['weekly_salary', 'hot_lead_bonus']),
    (admin as any).from('zones').select('id, name'),
  ])

  const settings = Object.fromEntries(((settingsResult.data ?? []) as { key: string; value: string }[]).map(s => [s.key, s.value]))
  const weeklySalary  = parseInt(settings.weekly_salary  ?? '40000', 10)
  const hotLeadBonus  = parseInt(settings.hot_lead_bonus ?? '500',   10)

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  // Per-agent captures this week
  const captureMap: Record<string, { total: number; hot: number }> = {}
  for (const r of (capturesResult.data ?? [])) {
    if (!captureMap[r.captured_by]) captureMap[r.captured_by] = { total: 0, hot: 0 }
    captureMap[r.captured_by].total++
    if (r.tag === 'hot') captureMap[r.captured_by].hot++
  }

  // Latest payout per agent
  const payoutMap: Record<string, { amount: number; status: string; paid_at: string | null }> = {}
  for (const p of (payoutsResult.data ?? [])) {
    if (!payoutMap[p.agent_id]) {
      payoutMap[p.agent_id] = { amount: p.net_amount, status: p.status, paid_at: p.paid_at }
    }
  }
  // Total paid (all time) per agent for summary
  const totalPaidMap: Record<string, number> = {}
  for (const p of (payoutsResult.data ?? [])) {
    if (p.status === 'paid') totalPaidMap[p.agent_id] = (totalPaidMap[p.agent_id] ?? 0) + Number(p.net_amount)
  }

  const agents = ((agentsResult.data ?? []) as any[]).map(a => {
    const caps       = captureMap[a.id] ?? { total: 0, hot: 0 }
    const bonusTotal = caps.hot * hotLeadBonus
    const netOwed    = weeklySalary + bonusTotal
    const lastPayout = payoutMap[a.id]
    const isPaid     = lastPayout?.status === 'paid'

    return {
      id:                  a.id,
      full_name:           a.full_name,
      employee_id:         a.employee_id ?? null,
      zone_name:           a.assigned_zone_id ? (zoneMap[a.assigned_zone_id] ?? null) : null,
      is_active:           a.is_active,
      bank_name:           a.bank_name ?? null,
      bank_account_masked: a.bank_account_masked ?? null,
      total_captures:      caps.total,
      hot_leads:           caps.hot,
      salary_owed:         weeklySalary,
      hot_lead_bonus:      bonusTotal,
      deductions:          0,
      net_owed:            isPaid ? 0 : netOwed,
      last_paid_at:        lastPayout?.paid_at ?? null,
      status:              (isPaid ? 'paid' : lastPayout?.status ?? 'unpaid') as 'unpaid' | 'processing' | 'paid',
    }
  })

  const totalOwed  = agents.reduce((s, a) => s + a.net_owed, 0)
  const totalPaid  = Object.values(totalPaidMap).reduce((s, v) => s + v, 0)
  const pendingCount = agents.filter(a => a.net_owed > 0).length

  return (
    <PayoutsView
      agents={agents}
      weeklyMarshal={weeklySalary}
      hotLeadBonus={hotLeadBonus}
      totalOwed={totalOwed}
      totalPaid={totalPaid}
      pendingCount={pendingCount}
    />
  )
}
