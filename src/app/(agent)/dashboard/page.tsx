import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardView } from '@/components/agent/DashboardView'
import type { User } from '@/lib/types/database'

type ProfileRow = Pick<User, 'full_name' | 'quality_score' | 'assigned_zone_id'>
type ZoneEmbed  = { zones: { name: string } | null }

type RecentRow = {
  id: string
  name: string
  tag: string | null
  created_at: string
  zones: { name: string } | null
}

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

  // ── 1. Profile + assigned zone ───────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, quality_score, assigned_zone_id, zones(name)')
    .eq('id', user.id)
    .single() as { data: (ProfileRow & ZoneEmbed) | null; error: unknown }

  // ── 2. Stats + recent captures (parallel) ────────────────────────────────
  const uid = user.id

  const [todayCount, weekCount, lastWeekCount, hotLeads, recentResult] = await Promise.all([
    awaitCount(
      supabase.from('restaurants').select('*', { count: 'exact', head: true })
        .eq('captured_by', uid).gte('created_at', todayISO)
    ),
    awaitCount(
      supabase.from('restaurants').select('*', { count: 'exact', head: true })
        .eq('captured_by', uid).gte('created_at', weekISO)
    ),
    awaitCount(
      supabase.from('restaurants').select('*', { count: 'exact', head: true })
        .eq('captured_by', uid).gte('created_at', lastWeekISO).lt('created_at', weekISO)
    ),
    awaitCount(
      supabase.from('restaurants').select('*', { count: 'exact', head: true })
        .eq('captured_by', uid).gte('created_at', weekISO).eq('tag', 'hot')
    ),
    supabase
      .from('restaurants')
      .select('id, name, tag, created_at, zones(name)')
      .eq('captured_by', uid)
      .order('created_at', { ascending: false })
      .limit(3) as unknown as Promise<{ data: RecentRow[] | null }>,
  ])

  const recentCaptures = (recentResult.data ?? []).map(r => ({
    id:         r.id,
    name:       r.name,
    tag:        r.tag,
    created_at: r.created_at,
    zone_name:  r.zones?.name ?? null,
  }))

  return (
    <DashboardView
      user={{
        full_name:     profile?.full_name ?? 'Agent',
        quality_score: Number(profile?.quality_score ?? 0),
        zone_name:     profile?.zones?.name ?? null,
      }}
      stats={{
        today_count:     todayCount,
        week_count:      weekCount,
        last_week_count: lastWeekCount,
        hot_leads:       hotLeads,
      }}
      recent_captures={recentCaptures}
    />
  )
}
