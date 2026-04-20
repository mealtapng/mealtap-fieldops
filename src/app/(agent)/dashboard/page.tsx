import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardView } from '@/components/agent/DashboardView'
import type { User } from '@/lib/types/database'

type ProfileRow = Pick<User, 'full_name' | 'quality_score' | 'assigned_zone_id' | 'referral_code'>

type RecentRow = {
  id: string
  user_name: string
  conversion_status: string | null
  disco_area: string | null
  created_at: string
  zone_id: string | null
}

type ZoneRow = { id: string; name: string }

/** Await a Supabase count query and return the numeric result (0 if null/error). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function awaitCount(query: any): Promise<number> {
  const { count } = await query
  return count ?? 0
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Date boundaries (UTC) ────────────────────────────────────────────────
  const now        = new Date()
  const today      = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dow        = now.getUTCDay()  // 0=Sun … 6=Sat
  const weekStart  = new Date(today)
  weekStart.setUTCDate(today.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setUTCDate(weekStart.getUTCDate() - 7)

  const todayISO    = today.toISOString()
  const weekISO     = weekStart.toISOString()
  const lastWeekISO = lastWeekStart.toISOString()

  // ── 1. Profile ────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, quality_score, assigned_zone_id, referral_code')
    .eq('id', user.id)
    .single() as { data: ProfileRow | null; error: unknown }

  // ── 2. Stats + recent onboardings (parallel) ─────────────────────────────
  const uid = user.id

  const [todayCount, weekCount, lastWeekCount, conversions, recentResult] = await Promise.all([
    awaitCount(
      supabase.from('onboardings').select('*', { count: 'exact', head: true })
        .eq('agent_id', uid).gte('created_at', todayISO)
    ),
    awaitCount(
      supabase.from('onboardings').select('*', { count: 'exact', head: true })
        .eq('agent_id', uid).gte('created_at', weekISO)
    ),
    awaitCount(
      supabase.from('onboardings').select('*', { count: 'exact', head: true })
        .eq('agent_id', uid).gte('created_at', lastWeekISO).lt('created_at', weekISO)
    ),
    awaitCount(
      supabase.from('onboardings').select('*', { count: 'exact', head: true })
        .eq('agent_id', uid).gte('created_at', weekISO).eq('conversion_status', 'converted')
    ),
    supabase
      .from('onboardings')
      .select('id, user_name, conversion_status, disco_area, created_at, zone_id')
      .eq('agent_id', uid)
      .order('created_at', { ascending: false })
      .limit(3) as unknown as Promise<{ data: RecentRow[] | null }>,
  ])

  // ── 3. Resolve zone names ─────────────────────────────────────────────────
  const zoneIds = Array.from(new Set([
    profile?.assigned_zone_id,
    ...((recentResult.data ?? []).map(r => r.zone_id)),
  ].filter((id): id is string => !!id)))

  const zoneMap: Record<string, string> = {}
  if (zoneIds.length > 0) {
    const { data: zones } = await supabase
      .from('zones')
      .select('id, name')
      .in('id', zoneIds) as { data: ZoneRow[] | null; error: unknown }
    for (const z of zones ?? []) zoneMap[z.id] = z.name
  }

  // ── Assemble props ────────────────────────────────────────────────────────
  const recentOnboardings = (recentResult.data ?? []).map(r => ({
    id:                r.id,
    name:              r.user_name,
    disco_area:        r.disco_area,
    conversion_status: r.conversion_status,
    created_at:        r.created_at,
  }))

  return (
    <DashboardView
      user={{
        full_name:     profile?.full_name ?? 'Agent',
        quality_score: Number(profile?.quality_score ?? 0),
        zone_name:     profile?.assigned_zone_id ? (zoneMap[profile.assigned_zone_id] ?? null) : null,
        referral_code: profile?.referral_code ?? null,
      }}
      stats={{
        today_count:     todayCount,
        week_count:      weekCount,
        last_week_count: lastWeekCount,
        conversions,
      }}
      recent_onboardings={recentOnboardings}
    />
  )
}
