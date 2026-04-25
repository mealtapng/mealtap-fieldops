import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { redirect } from 'next/navigation'
import { DashboardView } from '@/components/agent/DashboardView'
import type { User } from '@/lib/types/database'

type ProfileRow = Pick<User, 'full_name' | 'quality_score' | 'assigned_zone_id'>
type ZoneRow = { id: string; name: string }

async function awaitCount(query: any): Promise<number> {
  const { count } = await query
  return count ?? 0
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now       = new Date()
  const today     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dow       = now.getUTCDay()
  const weekStart = new Date(today)
  weekStart.setUTCDate(today.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const todayISO    = today.toISOString()
  const weekISO     = weekStart.toISOString()
  const lastWeekISO = lastWeekStart.toISOString()

  const adminDb = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const uid = user.id

  const [profile, todayCount, weekCount, lastWeekCount, hotLeads, recentResult, settingsResult] = await Promise.all([
    adminDb.from('users').select('full_name, quality_score, assigned_zone_id').eq('id', uid).single() as unknown as Promise<{ data: ProfileRow | null }>,
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', uid).gte('created_at', todayISO)),
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', uid).gte('created_at', weekISO)),
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', uid).gte('created_at', lastWeekISO).lt('created_at', weekISO)),
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', uid).gte('created_at', weekISO).eq('tag', 'hot')),
    supabase.from('restaurants').select('id, name, zone_id, tag, created_at').eq('captured_by', uid).order('created_at', { ascending: false }).limit(5) as unknown as Promise<{ data: any[] | null }>,
    adminDb.from('app_settings').select('key, value').in('key', ['daily_target', 'hot_lead_bonus']) as unknown as Promise<{ data: { key: string; value: string }[] | null }>,
  ])

  const settings = Object.fromEntries((settingsResult.data ?? []).map(s => [s.key, s.value]))
  const dailyTarget   = parseInt(settings.daily_target   ?? '20', 10)
  const hotLeadBonus  = parseInt(settings.hot_lead_bonus ?? '500', 10)

  const zoneIds = Array.from(new Set([
    profile.data?.assigned_zone_id,
    ...((recentResult.data ?? []).map((r: any) => r.zone_id)),
  ].filter((id): id is string => !!id)))

  const zoneMap: Record<string, string> = {}
  if (zoneIds.length > 0) {
    const { data: zones } = await supabase.from('zones').select('id, name').in('id', zoneIds) as { data: ZoneRow[] | null }
    for (const z of zones ?? []) zoneMap[z.id] = z.name
  }

  const recentCaptures = (recentResult.data ?? []).map((r: any) => ({
    id:         r.id,
    name:       r.name,
    zone_name:  r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
    tag:        r.tag,
    created_at: r.created_at,
  }))

  return (
    <DashboardView
      user={{
        full_name:     profile.data?.full_name ?? 'there',
        quality_score: Number(profile.data?.quality_score ?? 0),
        zone_name:     profile.data?.assigned_zone_id ? (zoneMap[profile.data.assigned_zone_id] ?? null) : null,
      }}
      stats={{
        today_count:     todayCount,
        week_count:      weekCount,
        last_week_count: lastWeekCount,
        hot_leads:       hotLeads,
      }}
      recent_captures={recentCaptures}
      daily_target={dailyTarget}
      hot_lead_bonus={hotLeadBonus}
    />
  )
}
