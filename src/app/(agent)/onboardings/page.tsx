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

  const { data: captures } = await (admin as any)
    .from('restaurants')
    .select('id, name, owner_phone, tag, created_at, zone_id')
    .eq('captured_by', user.id)
    .order('created_at', { ascending: false })

  const rows = captures ?? []

  const zoneIds = Array.from(new Set(rows.map((r: any) => r.zone_id).filter(Boolean))) as string[]
  const zoneMap: Record<string, string> = {}
  if (zoneIds.length > 0) {
    const { data: zones } = await (admin as any).from('zones').select('id, name').in('id', zoneIds)
    for (const z of (zones ?? [])) zoneMap[z.id] = z.name
  }

  const items = rows.map((r: any) => ({
    id:          r.id,
    name:        r.name,
    owner_phone: r.owner_phone,
    tag:         r.tag,
    created_at:  r.created_at,
    zone_name:   r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
  }))

  return <OnboardingsView captures={items} />
}
