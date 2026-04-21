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

  const [agentsResult, conversionsResult, payoutsResult, settingsResult, zonesResult] = await Promise.all([
    (admin as any)
      .from('users')
      .select('id, full_name, employee_id, assigned_zone_id, is_active, bank_name, bank_account_masked')
      .in('role', ['agent', 'field_lead'])
      .order('full_name'),

    (admin as any)
      .from('onboardings')
      .select('agent_id')
      .eq('conversion_status', 'converted'),

    (admin as any)
      .from('payouts')
      .select('agent_id, amount, created_at, note'),

    (admin as any)
      .from('settings')
      .select('key, value'),

    (admin as any)
      .from('zones')
      .select('id, name'),
  ])

  const commission = Number(
    ((settingsResult.data ?? []) as Array<{ key: string; value: string }>)
      .find(s => s.key === 'commission_per_conversion')?.value ?? '100'
  )

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  // Count conversions per agent
  const convMap: Record<string, number> = {}
  for (const r of (conversionsResult.data ?? [])) {
    convMap[r.agent_id] = (convMap[r.agent_id] ?? 0) + 1
  }

  // Sum payouts per agent
  const paidMap: Record<string, number> = {}
  for (const p of (payoutsResult.data ?? [])) {
    paidMap[p.agent_id] = (paidMap[p.agent_id] ?? 0) + Number(p.amount)
  }

  const agents = ((agentsResult.data ?? []) as any[]).map(a => {
    const conversions = convMap[a.id] ?? 0
    const earned      = conversions * commission
    const paid        = paidMap[a.id] ?? 0
    return {
      id:                  a.id,
      full_name:           a.full_name,
      employee_id:         a.employee_id,
      zone_name:           a.assigned_zone_id ? (zoneMap[a.assigned_zone_id] ?? null) : null,
      is_active:           a.is_active,
      bank_name:           a.bank_name ?? null,
      bank_account_masked: a.bank_account_masked ?? null,
      conversions,
      earned,
      paid,
      outstanding:         Math.max(0, earned - paid),
    }
  })

  const totalOutstanding = agents.reduce((s, a) => s + a.outstanding, 0)
  const totalPaid        = agents.reduce((s, a) => s + a.paid, 0)
  const totalEarned      = agents.reduce((s, a) => s + a.earned, 0)

  return (
    <PayoutsView
      agents={agents}
      commission={commission}
      totalOutstanding={totalOutstanding}
      totalPaid={totalPaid}
      totalEarned={totalEarned}
    />
  )
}
