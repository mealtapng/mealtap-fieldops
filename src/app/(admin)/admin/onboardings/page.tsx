import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingsTable } from '@/components/admin/OnboardingsTable'

export default async function OnboardingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [onboardingsResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('onboardings')
      .select('id, user_name, user_phone, disco_area, conversion_status, token_amount_purchased, agent_id, zone_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    (supabase as any)
      .from('zones')
      .select('id, name'),
  ])

  const raw = onboardingsResult.data ?? []

  // Resolve agent names
  const agentIds = Array.from(new Set(raw.map((r: any) => r.agent_id).filter(Boolean)))
  const usersResult = agentIds.length
    ? await (supabase as any).from('users').select('id, full_name').in('id', agentIds)
    : { data: [] }

  const userMap: Record<string, string> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  const onboardings = raw.map((r: any) => ({
    id:                r.id,
    user_name:         r.user_name,
    user_phone:        r.user_phone ?? null,
    disco_area:        r.disco_area ?? null,
    conversion_status: r.conversion_status,
    token_amount:      r.token_amount_purchased ?? null,
    agent_name:        userMap[r.agent_id] ?? 'Unknown',
    zone_name:         r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
    created_at:        r.created_at,
  }))

  return (
    <OnboardingsTable
      onboardings={onboardings}
      total={onboardings.length}
    />
  )
}
