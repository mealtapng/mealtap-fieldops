import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { ZoneView } from '@/components/agent/ZoneView'

export default async function ZonePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get agent profile with zone
  const { data: profile } = await (admin as any)
    .from('users')
    .select('full_name, assigned_zone_id')
    .eq('id', user.id)
    .single()

  if (!profile?.assigned_zone_id) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="max-w-md mx-auto w-full flex flex-col min-h-screen px-4 pt-12">
          <a href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Dashboard
          </a>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <p className="font-bold text-ink">No zone assigned</p>
            <p className="text-sm text-muted">Your supervisor hasn&apos;t assigned a zone yet. Check back soon.</p>
          </div>
        </div>
      </div>
    )
  }

  // Get zone info + all agent onboardings in this zone
  const [zoneResult, onboardingsResult] = await Promise.all([
    (admin as any)
      .from('zones')
      .select('id, name, center_lat, center_lng, radius_km')
      .eq('id', profile.assigned_zone_id)
      .single(),

    (admin as any)
      .from('onboardings')
      .select('id, user_name, disco_area, conversion_status, created_at, lat, lng')
      .eq('agent_id', user.id)
      .eq('zone_id', profile.assigned_zone_id)
      .order('created_at', { ascending: false }),
  ])

  const zone        = zoneResult.data
  const onboardings = onboardingsResult.data ?? []

  const total      = onboardings.length
  const converted  = onboardings.filter((o: any) => o.conversion_status === 'converted').length
  const pending    = onboardings.filter((o: any) => o.conversion_status === 'pending').length

  return (
    <ZoneView
      zone={{ name: zone?.name ?? 'My Zone', center_lat: zone?.center_lat ?? null, center_lng: zone?.center_lng ?? null }}
      stats={{ total, converted, pending }}
      onboardings={onboardings}
    />
  )
}
