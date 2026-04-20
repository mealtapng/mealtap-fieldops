'use client'

import { dayLabel } from '@/lib/format'
import { CapturesTable } from './CapturesTable'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id:               string
  full_name:        string
  assigned_zone_id: string | null
  zone_name?:       string | null
}

interface LeaderboardEntry {
  agent_id:    string
  full_name:   string
  zone_name:   string | null
  total:       number
  conversions: number
}

interface Onboarding {
  id:                string
  name:              string
  disco_area:        string | null
  conversion_status: string | null
  created_at:        string
  agent_name:        string
  zone_name:         string | null
}

interface StatusCounts {
  converted: number
  pending:   number
  failed:    number
}

interface Props {
  todayCount:          number
  yesterdayCount:      number
  weekConversionsCount: number
  totalCount:          number
  statusCounts:        StatusCounts
  activeAgents:        Agent[]
  leaderboard:         LeaderboardEntry[]
  captures:            Onboarding[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function pctChange(today: number, yesterday: number): string {
  if (yesterday === 0) return today > 0 ? '+100%' : '—'
  const pct = Math.round(((today - yesterday) / yesterday) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  title:          string
  value:          string | number
  sub?:           string
  subColour?:     string
  progress?:      number
  progressLabel?: string
  children?:      React.ReactNode
}

function KPICard({ title, value, sub, subColour, progress, progressLabel, children }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-line">
      <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase">{title}</p>
      <p className="text-4xl font-bold text-ink mt-2 leading-none">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${subColour ?? 'text-muted-brand'}`}>{sub}</p>
      )}
      {progress != null && (
        <div className="mt-3">
          <div className="h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          {progressLabel && (
            <p className="text-[10px] text-muted-brand mt-1">{progressLabel}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminDashboard({
  todayCount,
  yesterdayCount,
  weekConversionsCount,
  totalCount,
  statusCounts,
  activeAgents,
  leaderboard,
  captures,
}: Props) {
  const todayPct      = pctChange(todayCount, yesterdayCount)
  const todayTarget   = 80
  const todayProgress = Math.min(100, (todayCount / todayTarget) * 100)
  const pctColour     = todayCount >= yesterdayCount ? 'text-brand' : 'text-red-500'

  return (
    <div className="p-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-brand">{dayLabel(new Date())}</p>
          <h1 className="text-3xl font-bold text-brand mt-0.5">Operations Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-xl border border-line text-sm font-semibold text-ink cursor-default select-none">
            Today
            <svg className="w-3.5 h-3.5 text-muted-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          <a
            href="/admin/messages"
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-semibold shadow-sm shadow-success/20 hover:bg-success-dark transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Broadcast
          </a>
        </div>
      </div>

      {/* ── KPI grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Card 1: Onboardings today */}
        <KPICard
          title="Onboardings today"
          value={todayCount}
          sub={`${todayPct} vs yesterday`}
          subColour={pctColour}
          progress={todayProgress}
          progressLabel={`${todayCount} of ${todayTarget} target`}
        />

        {/* Card 2: Conversions this week */}
        <KPICard
          title="Conversions (week)"
          value={weekConversionsCount}
          sub="verified conversions this week"
        />

        {/* Card 3: Total onboardings */}
        <KPICard
          title="Total onboardings"
          value={totalCount}
        >
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="text-[11px] text-muted-brand">✅ {statusCounts.converted} Converted</span>
            <span className="text-[11px] text-muted-brand">⏳ {statusCounts.pending} Pending</span>
            <span className="text-[11px] text-muted-brand">✕ {statusCounts.failed} Failed</span>
          </div>
        </KPICard>

        {/* Card 4: Active agents */}
        <KPICard
          title="Active agents"
          value={activeAgents.length}
          sub={activeAgents.length === 1 ? 'agent on the field' : 'agents on the field'}
        >
          {activeAgents.length > 0 && (
            <div className="flex -space-x-2 mt-3">
              {activeAgents.slice(0, 6).map(a => (
                <div
                  key={a.id}
                  title={a.full_name}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-success border-2 border-white flex items-center justify-center"
                >
                  <span className="text-[9px] font-bold text-white">{initials(a.full_name)}</span>
                </div>
              ))}
              {activeAgents.length > 6 && (
                <div className="w-8 h-8 rounded-full bg-line border-2 border-white flex items-center justify-center">
                  <span className="text-[9px] text-muted-brand font-bold">+{activeAgents.length - 6}</span>
                </div>
              )}
            </div>
          )}
        </KPICard>

      </div>

      {/* ── Leaderboard ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-5">
        <p className="font-bold text-ink mb-4">🏆 Leaderboard — This week</p>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-brand py-4 text-center">No onboardings this week yet</p>
        ) : (
          <div className="space-y-1">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.agent_id}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl ${i === 0 ? 'bg-success-light' : 'hover:bg-cream/50'} transition-colors`}
              >
                {/* Rank */}
                <span className={`text-sm font-bold w-5 text-center flex-shrink-0 ${i === 0 ? 'text-success' : 'text-muted-brand'}`}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i === 0 ? 'border-success bg-success' : 'border-transparent bg-gradient-to-br from-brand to-success'}`}>
                  <span className="text-xs font-bold text-white">{initials(entry.full_name)}</span>
                </div>

                {/* Name + zone */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{entry.full_name}</p>
                  <p className="text-[11px] text-muted-brand">{entry.zone_name ?? 'No zone'}</p>
                </div>

                {/* Conversions */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-brand">Conversions</p>
                  <p className="text-sm font-bold text-success">{entry.conversions}</p>
                </div>

                {/* Total */}
                <div className="text-right flex-shrink-0 w-16">
                  <p className="text-xs text-muted-brand">Onboardings</p>
                  <p className="text-sm font-bold text-ink">{entry.total}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent onboardings table ────────────────────────────────────────── */}
      <CapturesTable captures={captures} />

    </div>
  )
}
