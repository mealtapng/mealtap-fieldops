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
    <div
      className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid rgba(27,94,32,0.08)', boxShadow: '0 2px 8px rgba(27,94,32,0.06)' }}
    >
      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#4a6b4c' }}>{title}</p>
      <p className="text-4xl font-display font-bold mt-2 leading-none" style={{ color: '#1a2e1b' }}>{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${subColour ?? 'text-muted-brand'}`}>{sub}</p>
      )}
      {progress != null && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E8F5E9' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%`, background: '#25D366' }}
            />
          </div>
          {progressLabel && (
            <p className="text-[10px] mt-1" style={{ color: '#7a9a7c' }}>{progressLabel}</p>
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
          <p className="text-sm" style={{ color: '#7a9a7c' }}>{dayLabel(new Date())}</p>
          <h1 className="text-3xl font-display font-bold mt-0.5" style={{ color: '#1B5E20' }}>Operations Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-full text-sm font-semibold cursor-default select-none"
            style={{ border: '1px solid #d4e6d5', color: '#1a2e1b' }}
          >
            Today
            <svg className="w-3.5 h-3.5" style={{ color: '#7a9a7c' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          <a
            href="/admin/messages"
            className="flex items-center gap-2 px-5 py-2 text-white rounded-full text-sm font-semibold transition-all"
            style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}
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
            <span className="text-[11px]" style={{ color: '#1B5E20' }}>✅ {statusCounts.converted} Converted</span>
            <span className="text-[11px]" style={{ color: '#7a9a7c' }}>⏳ {statusCounts.pending} Pending</span>
            <span className="text-[11px]" style={{ color: '#7a9a7c' }}>✕ {statusCounts.failed} Not interested</span>
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
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                >
                  <span className="text-[9px] font-bold text-white">{initials(a.full_name)}</span>
                </div>
              ))}
              {activeAgents.length > 6 && (
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center" style={{ background: '#E8F5E9' }}>
                  <span className="text-[9px] font-bold" style={{ color: '#1B5E20' }}>+{activeAgents.length - 6}</span>
                </div>
              )}
            </div>
          )}
        </KPICard>

      </div>

      {/* ── Leaderboard ────────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl p-5"
        style={{ border: '1px solid rgba(27,94,32,0.08)', boxShadow: '0 2px 8px rgba(27,94,32,0.06)' }}
      >
        {/* Section label — matches powerchat.ng section-label style */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-0.5" style={{ background: '#F9A825' }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1B5E20' }}>
            Leaderboard — This week
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#7a9a7c' }}>No onboardings this week yet</p>
        ) : (
          <div className="space-y-1">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.agent_id}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors"
                style={i === 0 ? { background: '#E8F5E9' } : {}}
              >
                {/* Rank */}
                <span
                  className="text-sm font-bold w-5 text-center flex-shrink-0"
                  style={{ color: i === 0 ? '#F9A825' : '#7a9a7c' }}
                >
                  {i + 1}
                </span>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(135deg, #1B5E20, #F9A825)'
                      : 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                  }}
                >
                  <span className="text-xs font-bold text-white">{initials(entry.full_name)}</span>
                </div>

                {/* Name + zone */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1a2e1b' }}>{entry.full_name}</p>
                  <p className="text-[11px]" style={{ color: '#7a9a7c' }}>{entry.zone_name ?? 'No zone'}</p>
                </div>

                {/* Conversions */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: '#7a9a7c' }}>Conversions</p>
                  <p className="text-sm font-bold" style={{ color: '#1B5E20' }}>{entry.conversions}</p>
                </div>

                {/* Total */}
                <div className="text-right flex-shrink-0 w-16">
                  <p className="text-xs" style={{ color: '#7a9a7c' }}>Onboardings</p>
                  <p className="text-sm font-bold" style={{ color: '#1a2e1b' }}>{entry.total}</p>
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
