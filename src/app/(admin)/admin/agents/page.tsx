import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentsTable } from '@/components/admin/AgentsTable'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [agentsResult, capturesResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('users')
      .select('id, full_name, employee_id, phone, role, assigned_zone_id, quality_score, is_active, created_at, passport_photo_url')
      .in('role', ['agent', 'field_lead'])
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('restaurants')
      .select('captured_by, tag'),
    (supabase as any)
      .from('zones')
      .select('id, name'),
  ])

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  const captureCounts: Record<string, { total: number; hot: number }> = {}
  for (const r of (capturesResult.data ?? [])) {
    if (!r.captured_by) continue
    if (!captureCounts[r.captured_by]) captureCounts[r.captured_by] = { total: 0, hot: 0 }
    captureCounts[r.captured_by].total++
    if (r.tag === 'hot') captureCounts[r.captured_by].hot++
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
    total_captures:     captureCounts[a.id]?.total ?? 0,
    hot_leads:          captureCounts[a.id]?.hot ?? 0,
  }))

  const zones = (zonesResult.data ?? []).map((z: any) => ({ id: z.id, name: z.name }))

  return <AgentsTable agents={agents} zones={zones} />
}
