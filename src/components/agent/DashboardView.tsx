'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { timeAgo, formatNaira, dayLabel } from '@/lib/format'
import { BottomNav } from '@/components/agent/BottomNav'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentOnboarding {
  id: string
  name: string
  disco_area: string | null
  conversion_status: string | null
  created_at: string
}

interface DashboardProps {
  user: {
    full_name: string
    quality_score: number
    zone_name: string | null
    referral_code: string | null
  }
  stats: {
    today_count: number
    week_count: number
    last_week_count: number
    conversions: number
  }
  recent_onboardings: RecentOnboarding[]
}

// ── Progress ring ─────────────────────────────────────────────────────────────

const RING_R    = 52
const RING_SIZE = 120  // viewBox width/height (cx = cy = 60)
const CIRCUMFERENCE = 2 * Math.PI * RING_R  // ≈ 326.7

function ProgressRing({ todayCount }: { todayCount: number }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE)

  useEffect(() => {
    const fraction = Math.min(todayCount / 25, 1)
    setOffset(CIRCUMFERENCE * (1 - fraction))
  }, [todayCount])

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="block"
    >
      {/* Track */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_R}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={8}
      />
      {/* Progress arc */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_R}
        fill="none"
        stroke="#25D366"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string | null }) {
  if (!status) return null
  const styles: Record<string, string> = {
    converted: 'bg-success-light text-success',
    pending:   'bg-amber-50 text-amber-700',
    failed:    'bg-line text-muted-brand',
  }
  const label: Record<string, string> = {
    converted: 'Converted',
    pending:   'Pending',
    failed:    'Not interested',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-line text-muted-brand'}`}>
      {label[status] ?? status}
    </span>
  )
}

// ── Quality score segments ────────────────────────────────────────────────────

function QualityBar({ score }: { score: number }) {
  const filled = Math.round(score / 20)
  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{ background: i < filled ? '#1B5E20' : '#d4e6d5' }}
        />
      ))}
    </div>
  )
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  children,
  sub,
}: {
  label: string
  children: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[10px] font-semibold tracking-wider text-muted-brand uppercase mb-1">
        {label}
      </p>
      <div className="text-2xl font-bold text-ink">{children}</div>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardView({ user, stats, recent_onboardings }: DashboardProps) {
  const firstName = user.full_name.split(' ')[0]
  const initials  = user.full_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const now    = new Date()
  const hour   = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
               'Good evening'

  const weekDiff = stats.week_count - stats.last_week_count
  const earnings = stats.conversions * 100

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">

        {/* ── Hero section ───────────────────────────────────────────────── */}
        <div className="px-6 pt-8 pb-8 relative" style={{ background: 'linear-gradient(160deg, #0D1B0E 0%, #0a2e0c 100%)' }}>

          {/* Date + greeting row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-1">
                {dayLabel(now)}
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {greeting},<br />{firstName}
              </h1>
              {user.referral_code && (
                <p className="text-xs text-white/60 font-medium mt-1">
                  Your code: <span className="text-white font-bold">{user.referral_code}</span>
                </p>
              )}
            </div>

            {/* Avatar */}
            <Link href="/profile" className="flex-shrink-0 mt-1">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-md" style={{ background: '#25D366' }}>
                <span className="text-sm font-bold text-white">{initials}</span>
              </div>
            </Link>
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-center mt-4 gap-2">
            <div className="relative">
              <ProgressRing todayCount={stats.today_count} />
              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.today_count}</span>
                <span className="text-[10px] text-white/60 font-medium">of 25</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-white/70">
              ⚡ Today&apos;s onboardings
            </p>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 px-4 pt-5 pb-28 space-y-5">

          {/* CTA */}
          <Link
            href="/onboard"
            className="block w-full text-white font-bold text-base py-4 rounded-full text-center transition-all"
            style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
          >
            + New Onboarding →
          </Link>

          {/* 2×2 stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* This week */}
            <StatCard
              label="This week"
              sub={
                <p className={`text-xs font-semibold ${weekDiff > 0 ? 'text-success' : 'text-muted-brand'}`}>
                  {weekDiff > 0 ? `↑${weekDiff}` : weekDiff < 0 ? `↓${Math.abs(weekDiff)}` : '—'} vs last week
                </p>
              }
            >
              {stats.week_count}
            </StatCard>

            {/* Conversions */}
            <StatCard
              label="Conversions"
              sub={<p className="text-xs text-muted-brand font-medium">this week</p>}
            >
              {stats.conversions}
            </StatCard>

            {/* Earnings */}
            <StatCard
              label="Earnings (week)"
              sub={<p className="text-[10px] text-muted-brand font-medium">₦100 per conversion</p>}
            >
              <span className="text-xl">{formatNaira(earnings)}</span>
            </StatCard>

            {/* Quality score */}
            <StatCard
              label="Quality score"
              sub={<QualityBar score={user.quality_score} />}
            >
              <span className="text-xl">{Math.round(user.quality_score)}</span>
              <span className="text-sm font-normal text-muted-brand">/100</span>
            </StatCard>
          </div>

          {/* Today's zone */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted-brand uppercase mb-2">
              Today&apos;s zone
            </p>
            <Link
              href="/zone"
              className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <span className="font-semibold text-ink">
                  {user.zone_name ?? 'No zone assigned'}
                </span>
              </div>
              <svg className="w-5 h-5 text-muted-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          {/* Recent onboardings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-widest text-muted-brand uppercase">
                Recent onboardings
              </p>
              <Link href="/onboardings" className="text-xs font-semibold text-brand">
                View all
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
              {recent_onboardings.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-brand">
                  No onboardings yet. Tap + New Onboarding to start!
                </div>
              ) : (
                recent_onboardings.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-lg">
                      {['⚡', '🔌', '💡', '🔋', '📱'][i % 5]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.name}</p>
                      <p className="text-xs text-muted-brand truncate">
                        {item.disco_area ?? 'Unknown DISCO'} · {timeAgo(item.created_at)}
                      </p>
                    </div>
                    <StatusChip status={item.conversion_status} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        <BottomNav />

      </div>
    </div>
  )
}
