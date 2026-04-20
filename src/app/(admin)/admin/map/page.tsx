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

  const [restaurantsResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('restaurants')
      .select('id, name, address, lat, lng, tag, captured_by, created_at'),
    (supabase as any)
      .from('zones')
      .select('id, name, center_lat, center_lng, radius_km'),
  ])

  // Resolve agent names
  const agentIds = Array.from(
    new Set(
      (restaurantsResult.data ?? []).map((r: any) => r.captured_by).filter(Boolean)
    )
  )
  const usersResult = agentIds.length
    ? await (supabase as any).from('users').select('id, full_name').in('id', agentIds)
    : { data: [] }

  const userMap: Record<string, string> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const restaurants = (restaurantsResult.data ?? []).map((r: any) => ({
    id:         r.id,
    name:       r.name,
    address:    r.address,
    lat:        r.lat,
    lng:        r.lng,
    tag:        r.tag,
    agent_name: userMap[r.captured_by] ?? 'Unknown',
    created_at: r.created_at,
  }))

  const zones = (zonesResult.data ?? []).map((z: any) => ({
    id:         z.id,
    name:       z.name,
    center_lat: z.center_lat,
    center_lng: z.center_lng,
    radius_km:  z.radius_km ?? 2.0,
  }))

  const tagCounts = { hot: 0, warm: 0, cold: 0, not_a_fit: 0 }
  for (const r of restaurants) {
    if (r.tag in tagCounts) tagCounts[r.tag as keyof typeof tagCounts]++
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-4 border-b border-line bg-white flex items-center">
        <div>
          <h1 className="text-2xl font-bold text-forest">Live Field Map · Abuja</h1>
          <p className="text-sm text-muted-brand">
            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} captured across {zones.length} zone{zones.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Map fills remaining height */}
      <div className="flex-1 relative">
        <AdminMap
          restaurants={restaurants}
          zones={zones}
          tagCounts={tagCounts}
        />
      </div>
    </div>
  )
}
