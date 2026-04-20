import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentsTable } from '@/components/admin/AgentsTable'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [agentsResult, onboardingsResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('users')
      .select('id, full_name, employee_id, phone, role, assigned_zone_id, quality_score, is_active, created_at, passport_photo_url')
      .in('role', ['agent', 'field_lead'])
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('onboardings')
      .select('agent_id, conversion_status'),
    (supabase as any)
      .from('zones')
      .select('id, name'),
  ])

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  const onboardingCounts: Record<string, { total: number; conversions: number }> = {}
  for (const r of (onboardingsResult.data ?? [])) {
    if (!r.agent_id) continue
    if (!onboardingCounts[r.agent_id]) onboardingCounts[r.agent_id] = { total: 0, conversions: 0 }
    onboardingCounts[r.agent_id].total++
    if (r.conversion_status === 'converted') onboardingCounts[r.agent_id].conversions++
  }

  const agents = (agentsResult.data ?? []).map((a: any) => ({
    id:                 a.id,
    full_name:          a.full_name,
    employee_id:        a.employee_id,
    phone:              a.phone,
    role:               a.role,
    zone_name:          a.assigned_zone_id ? (zoneMap[a.assigned_zone_id] ?? null) : null,
    quality_score:      a.quality_score,
    is_active:          a.is_active,
    passport_photo_url: a.passport_photo_url,
    total_onboardings:  onboardingCounts[a.id]?.total ?? 0,
    conversions:        onboardingCounts[a.id]?.conversions ?? 0,
  }))

  const zones = (zonesResult.data ?? []).map((z: any) => ({ id: z.id, name: z.name }))

  return <AgentsTable agents={agents} zones={zones} />
}
