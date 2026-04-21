import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { OnboardingsView } from '@/components/agent/OnboardingsView'

export default async function OnboardingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: onboardings } = await (admin as any)
    .from('onboardings')
    .select('id, user_name, user_phone, disco_area, conversion_status, created_at, zone_id, meter_number')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })

  const rows = onboardings ?? []

  // Resolve zone names
  const zoneIds = Array.from(new Set(rows.map((r: any) => r.zone_id).filter(Boolean))) as string[]
  const zoneMap: Record<string, string> = {}
  if (zoneIds.length > 0) {
    const { data: zones } = await (admin as any)
      .from('zones')
      .select('id, name')
      .in('id', zoneIds)
    for (const z of (zones ?? [])) zoneMap[z.id] = z.name
  }

  const items = rows.map((r: any) => ({
    id:                r.id,
    user_name:         r.user_name,
    user_phone:        r.user_phone,
    disco_area:        r.disco_area,
    conversion_status: r.conversion_status,
    created_at:        r.created_at,
    zone_name:         r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
    meter_number:      r.meter_number ?? null,
  }))

  return <OnboardingsView onboardings={items} />
}
