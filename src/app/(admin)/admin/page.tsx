import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

async function awaitCount(query: any): Promise<number> {
  const { count } = await query
  return count ?? 0
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Date boundaries ───────────────────────────────────────────────────────
  const now          = new Date()
  const todayISO     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const weekISO      = (() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  })()

  // ── Wave 1: parallel independent queries ──────────────────────────────────
  const [
    todayCount,
    yesterdayCount,
    weekConversionsCount,
    totalCount,
    agentsResult,
    weekOnboardingsResult,
    recentResult,
    allStatusResult,
  ] = await Promise.all([
    awaitCount((supabase as any).from('onboardings').select('*', { count: 'exact', head: true }).gte('created_at', todayISO)),
    awaitCount((supabase as any).from('onboardings').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO)),
    awaitCount((supabase as any).from('onboardings').select('*', { count: 'exact', head: true }).eq('conversion_status', 'converted').gte('created_at', weekISO)),
    awaitCount((supabase as any).from('onboardings').select('*', { count: 'exact', head: true })),
    (supabase as any).from('users').select('id, full_name, assigned_zone_id').eq('role', 'agent').eq('is_active', true),
    (supabase as any).from('onboardings').select('agent_id, conversion_status').gte('created_at', weekISO),
    (supabase as any).from('onboardings').select('id, user_name, disco_area, conversion_status, created_at, zone_id, agent_id').order('created_at', { ascending: false }).limit(20),
    (supabase as any).from('onboardings').select('conversion_status').not('conversion_status', 'is', null),
  ])

  const activeAgents      = agentsResult.data         ?? []
  const weekOnboardings   = weekOnboardingsResult.data ?? []
  const recentOnboardings = recentResult.data          ?? []
  const allStatuses       = allStatusResult.data       ?? []

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusCounts = { converted: 0, pending: 0, failed: 0 }
  for (const r of allStatuses) {
    if (r.conversion_status in statusCounts) {
      statusCounts[r.conversion_status as keyof typeof statusCounts]++
    }
  }

  // ── Leaderboard (group by agent) ──────────────────────────────────────────
  const agentStats: Record<string, { total: number; conversions: number }> = {}
  for (const r of weekOnboardings) {
    if (!agentStats[r.agent_id]) agentStats[r.agent_id] = { total: 0, conversions: 0 }
    agentStats[r.agent_id].total++
    if (r.conversion_status === 'converted') agentStats[r.agent_id].conversions++
  }
  const leaderboardRaw = Object.entries(agentStats)
    .sort((a, b) => b[1].conversions - a[1].conversions || b[1].total - a[1].total)
    .slice(0, 4)

  // ── Wave 2: resolve user + zone names ─────────────────────────────────────
  const agentIds = Array.from(new Set([
    ...leaderboardRaw.map(([id]) => id),
    ...recentOnboardings.map((r: any) => r.agent_id),
  ].filter(Boolean)))

  const zoneIds = Array.from(new Set([
    ...activeAgents.map((a: any) => a.assigned_zone_id),
    ...recentOnboardings.map((r: any) => r.zone_id),
  ].filter(Boolean)))

  const [usersResult, zonesResult] = await Promise.all([
    agentIds.length > 0
      ? (supabase as any).from('users').select('id, full_name, assigned_zone_id').in('id', agentIds)
      : Promise.resolve({ data: [] }),
    zoneIds.length > 0
      ? (supabase as any).from('zones').select('id, name').in('id', zoneIds)
      : Promise.resolve({ data: [] }),
  ])

  const userMap: Record<string, string> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  // ── Assemble leaderboard ──────────────────────────────────────────────────
  const leaderboard = leaderboardRaw.map(([agentId, counts]) => {
    const agentRow = (usersResult.data ?? []).find((u: any) => u.id === agentId)
    return {
      agent_id:    agentId,
      full_name:   userMap[agentId] ?? 'Unknown',
      zone_name:   agentRow?.assigned_zone_id ? (zoneMap[agentRow.assigned_zone_id] ?? null) : null,
      total:       counts.total,
      conversions: counts.conversions,
    }
  })

  // ── Assemble recent onboardings ───────────────────────────────────────────
  const captures = recentOnboardings.map((r: any) => ({
    id:                r.id,
    name:              r.user_name,
    disco_area:        r.disco_area,
    conversion_status: r.conversion_status,
    created_at:        r.created_at,
    agent_name:        userMap[r.agent_id] ?? 'Unknown',
    zone_name:         r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
  }))

  return (
    <AdminDashboard
      todayCount={todayCount}
      yesterdayCount={yesterdayCount}
      weekConversionsCount={weekConversionsCount}
      totalCount={totalCount}
      statusCounts={statusCounts}
      activeAgents={activeAgents}
      leaderboard={leaderboard}
      captures={captures}
    />
  )
}
