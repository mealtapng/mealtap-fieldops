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
    weekHotCount,
    totalCount,
    agentsResult,
    weekCapturesResult,
    recentResult,
    allTagsResult,
  ] = await Promise.all([
    awaitCount((supabase as any).from('restaurants').select('*', { count: 'exact', head: true }).gte('created_at', todayISO)),
    awaitCount((supabase as any).from('restaurants').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayISO).lt('created_at', todayISO)),
    awaitCount((supabase as any).from('restaurants').select('*', { count: 'exact', head: true }).eq('tag', 'hot').gte('created_at', weekISO)),
    awaitCount((supabase as any).from('restaurants').select('*', { count: 'exact', head: true })),
    (supabase as any).from('users').select('id, full_name, assigned_zone_id').eq('role', 'agent').eq('is_active', true),
    (supabase as any).from('restaurants').select('captured_by, tag').gte('created_at', weekISO),
    (supabase as any).from('restaurants').select('id, name, address, tag, quality_score, created_at, zone_id, captured_by').order('created_at', { ascending: false }).limit(20),
    (supabase as any).from('restaurants').select('tag').not('tag', 'is', null),
  ])

  const activeAgents     = agentsResult.data     ?? []
  const weekCaptures     = weekCapturesResult.data ?? []
  const recentCaptures   = recentResult.data       ?? []
  const allTagged        = allTagsResult.data      ?? []

  // ── Tag breakdown ─────────────────────────────────────────────────────────
  const tagCounts = { hot: 0, warm: 0, cold: 0, not_a_fit: 0 }
  for (const r of allTagged) {
    if (r.tag in tagCounts) tagCounts[r.tag as keyof typeof tagCounts]++
  }

  // ── Leaderboard (group by agent) ──────────────────────────────────────────
  const agentCaptures: Record<string, { total: number; hot: number }> = {}
  for (const r of weekCaptures) {
    if (!agentCaptures[r.captured_by]) agentCaptures[r.captured_by] = { total: 0, hot: 0 }
    agentCaptures[r.captured_by].total++
    if (r.tag === 'hot') agentCaptures[r.captured_by].hot++
  }
  const leaderboardRaw = Object.entries(agentCaptures)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4)

  // ── Wave 2: resolve user + zone names ─────────────────────────────────────
  const agentIds = Array.from(new Set([
    ...leaderboardRaw.map(([id]) => id),
    ...recentCaptures.map((r: any) => r.captured_by),
  ].filter(Boolean)))

  const zoneIds = Array.from(new Set([
    ...activeAgents.map((a: any) => a.assigned_zone_id),
    ...recentCaptures.map((r: any) => r.zone_id),
  ].filter(Boolean)))

  const [usersResult, zonesResult] = await Promise.all([
    agentIds.length > 0
      ? (supabase as any).from('users').select('id, full_name, assigned_zone_id').in('id', agentIds)
      : Promise.resolve({ data: [] }),
    zoneIds.length > 0
      ? (supabase as any).from('zones').select('id, name').in('id', zoneIds)
      : Promise.resolve({ data: [] }),
  ])

  const userMap: Record<string, string>  = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const zoneMap: Record<string, string>  = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  // ── Assemble leaderboard ──────────────────────────────────────────────────
  const leaderboard = leaderboardRaw.map(([agentId, counts]) => {
    const agentRow = (usersResult.data ?? []).find((u: any) => u.id === agentId)
    return {
      agent_id:  agentId,
      full_name: userMap[agentId] ?? 'Unknown',
      zone_name: agentRow?.assigned_zone_id ? (zoneMap[agentRow.assigned_zone_id] ?? null) : null,
      total:     counts.total,
      hot:       counts.hot,
    }
  })

  // ── Assemble recent captures ──────────────────────────────────────────────
  const captures = recentCaptures.map((r: any) => ({
    id:            r.id,
    name:          r.name,
    address:       r.address,
    tag:           r.tag,
    quality_score: r.quality_score,
    created_at:    r.created_at,
    agent_name:    userMap[r.captured_by] ?? 'Unknown',
    zone_name:     r.zone_id ? (zoneMap[r.zone_id] ?? null) : null,
  }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminDashboard
      todayCount={todayCount}
      yesterdayCount={yesterdayCount}
      weekHotCount={weekHotCount}
      totalCount={totalCount}
      tagCounts={tagCounts}
      activeAgents={activeAgents}
      leaderboard={leaderboard}
      captures={captures}
    />
  )
}
