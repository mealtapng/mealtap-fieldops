import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'

const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-cream">
      <p className="text-muted-brand text-sm">Loading map…</p>
    </div>
  ),
})

export default async function AdminMapPage() {
  const supabase = await createClient()

  const [onboardingsResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('onboardings')
      .select('id, user_name, address, lat, lng, conversion_status, agent_id, created_at'),
    (supabase as any)
      .from('zones')
      .select('id, name, center_lat, center_lng, radius_km'),
  ])

  // Resolve agent names
  const agentIds = Array.from(
    new Set(
      (onboardingsResult.data ?? []).map((r: any) => r.agent_id).filter(Boolean)
    )
  )
  const usersResult = agentIds.length
    ? await (supabase as any).from('users').select('id, full_name').in('id', agentIds)
    : { data: [] }

  const userMap: Record<string, string> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const onboardings = (onboardingsResult.data ?? []).map((r: any) => ({
    id:                r.id,
    user_name:         r.user_name,
    address:           r.address,
    lat:               r.lat,
    lng:               r.lng,
    conversion_status: r.conversion_status,
    agent_name:        userMap[r.agent_id] ?? 'Unknown',
    created_at:        r.created_at,
  }))

  const zones = (zonesResult.data ?? []).map((z: any) => ({
    id:         z.id,
    name:       z.name,
    center_lat: z.center_lat,
    center_lng: z.center_lng,
    radius_km:  z.radius_km ?? 2.0,
  }))

  const statusCounts = { converted: 0, pending: 0, failed: 0 }
  for (const r of onboardings) {
    if (r.conversion_status in statusCounts) {
      statusCounts[r.conversion_status as keyof typeof statusCounts]++
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-4 border-b border-line bg-white flex items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand">Live Field Map</h1>
          <p className="text-sm text-muted-brand">
            {onboardings.length} onboarding{onboardings.length !== 1 ? 's' : ''} recorded across {zones.length} zone{zones.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <AdminMap
        onboardings={onboardings}
        zones={zones}
        statusCounts={statusCounts}
      />
    </div>
  )
}
