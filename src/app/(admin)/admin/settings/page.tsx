import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { SettingsView } from '@/components/admin/SettingsView'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const [settingsResult, zonesResult] = await Promise.all([
    (admin as any).from('app_settings').select('key, value'),
    (admin as any).from('zones').select('id, name, center_lat, center_lng').order('name'),
  ])

  const settingsMap: Record<string, string> = {}
  for (const s of (settingsResult.data ?? [])) settingsMap[s.key] = s.value

  return (
    <SettingsView
      settings={{
        daily_target:   settingsMap['daily_target']   ?? '20',
        weekly_salary:  settingsMap['weekly_salary']  ?? '40000',
        hot_lead_bonus: settingsMap['hot_lead_bonus'] ?? '500',
      }}
      zones={zonesResult.data ?? []}
    />
  )
}
