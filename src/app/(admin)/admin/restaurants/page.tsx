import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RestaurantsTable } from '@/components/admin/RestaurantsTable'

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [restaurantsResult, zonesResult, agentsResult] = await Promise.all([
    (supabase as any)
      .from('restaurants')
      .select('id, name, owner_name, owner_phone, address, cuisine_type, avg_meal_price_naira, tag, captured_by, zone_id, quality_score, created_at')
      .order('created_at', { ascending: false }),
    (supabase as any).from('zones').select('id, name'),
    (supabase as any).from('users').select('id, full_name').in('role', ['agent', 'field_lead']),
  ])

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  const agentMap: Record<string, string> = {}
  for (const a of (agentsResult.data ?? [])) agentMap[a.id] = a.full_name

  const restaurants = (restaurantsResult.data ?? []).map((r: any) => ({
    id:                   r.id,
    name:                 r.name,
    owner_name:           r.owner_name,
    owner_phone:          r.owner_phone,
    address:              r.address,
    cuisine_type:         r.cuisine_type,
    avg_meal_price_naira: r.avg_meal_price_naira,
    tag:                  r.tag,
    zone_id:              r.zone_id,
    zone_name:            r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
    agent_id:             r.captured_by,
    agent_name:           agentMap[r.captured_by] ?? 'Unknown',
    quality_score:        r.quality_score,
    created_at:           r.created_at,
  }))

  const zones  = (zonesResult.data  ?? []).map((z: any) => ({ id: z.id, name: z.name }))
  const agents = (agentsResult.data ?? []).map((a: any) => ({ id: a.id, name: a.full_name }))

  return <RestaurantsTable restaurants={restaurants} zones={zones} agents={agents} />
}
