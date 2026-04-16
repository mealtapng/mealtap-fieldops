'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { timeAgo, formatNaira, dayLabel } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentCapture {
  id: string
  name: string
  zone_name: string | null
  tag: string | null
  created_at: string
}

interface DashboardProps {
  user: {
    full_name: string
    quality_score: number
    zone_name: string | null
  }
  stats: {
    today_count: number
    week_count: number
    last_week_count: number
    hot_leads: number
  }
  recent_captures: RecentCapture[]
}

// ── Progress ring ─────────────────────────────────────────────────────────────

const RING_R    = 40
const RING_SIZE = 104  // viewBox width/height (cx = cy = 52)
const CIRCUMFERENCE = 2 * Math.PI * RING_R  // ≈ 251.3

function ProgressRing({ todayCount }: { todayCount: number }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE)

  useEffect(() => {
    const fraction = Math.min(todayCount / 20, 1)
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
        stroke="#1F3F1B"
        strokeWidth={8}
      />
      {/* Progress arc */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_R}
        fill="none"
        stroke="#C8622A"
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

// ── Tag chip ──────────────────────────────────────────────────────────────────

function TagChip({ tag }: { tag: string | null }) {
  if (!tag) return null
  const styles: Record<string, string> = {
    hot:        'bg-terra-light text-terra',
    warm:       'bg-forest-light text-forest',
    cold:       'bg-line text-muted-brand',
    not_a_fit:  'bg-line text-muted-brand',
  }
  const label: Record<string, string> = {
    hot: 'Hot', warm: 'Warm', cold: 'Cold', not_a_fit: 'Not a fit',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[tag] ?? 'bg-line text-muted-brand'}`}>
      {label[tag] ?? tag}
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
          className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-forest' : 'bg-line'}`}
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

// ── Bottom nav ────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 flex-1 transition-colors ${
        active ? 'text-forest' : 'text-muted-brand'
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className={`text-[10px] font-semibold ${active ? 'text-forest' : 'text-muted-brand'}`}>
        {label}
      </span>
    </Link>
  )
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
)

const CaptureIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const MessagesIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

const ProfileIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardView({ user, stats, recent_captures }: DashboardProps) {
  const pathname  = usePathname()
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

  const weekDiff   = stats.week_count - stats.last_week_count
  const earnings   = stats.week_count * 400 + stats.hot_leads * 1_000

  const navItems = [
    { href: '/dashboard', label: 'Home',     icon: HomeIcon },
    { href: '/capture',   label: 'Capture',  icon: CaptureIcon },
    { href: '/messages',  label: 'Messages', icon: MessagesIcon },
    { href: '/profile',   label: 'Profile',  icon: ProfileIcon },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">

        {/* ── Hero section ───────────────────────────────────────────────── */}
        <div className="bg-forest-dark px-6 pt-8 pb-8 relative">

          {/* Date + greeting row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-1">
                {dayLabel(now)}
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {greeting},<br />{firstName}
              </h1>
            </div>

            {/* Avatar */}
            <Link href="/profile" className="flex-shrink-0 mt-1">
              <div className="w-11 h-11 rounded-full bg-terra flex items-center justify-center shadow-md">
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
                <span className="text-[10px] text-white/60 font-medium">of 20</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-white/70">
              🔥 5-day streak
            </p>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 px-4 pt-5 pb-28 space-y-5">

          {/* CTA */}
          <Link
            href="/capture"
            className="block w-full bg-terra hover:bg-terra-dark active:bg-terra-dark text-white font-bold text-base py-4 rounded-2xl text-center shadow-lg shadow-terra/25 transition-colors"
          >
            + New Capture →
          </Link>

          {/* 2×2 stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* This week */}
            <StatCard
              label="This week"
              sub={
                <p className={`text-xs font-semibold ${weekDiff > 0 ? 'text-terra' : 'text-muted-brand'}`}>
                  {weekDiff > 0 ? `↑${weekDiff}` : weekDiff < 0 ? `↓${Math.abs(weekDiff)}` : '—'} vs last week
                </p>
              }
            >
              {stats.week_count}
            </StatCard>

            {/* Hot leads */}
            <StatCard
              label="Hot leads"
              sub={<p className="text-xs text-muted-brand font-medium">this week</p>}
            >
              {stats.hot_leads}
            </StatCard>

            {/* Earnings */}
            <StatCard
              label="Earnings (week)"
              sub={<p className="text-[10px] text-muted-brand font-medium">This week</p>}
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
              Today's zone
            </p>
            <Link
              href="/zone"
              className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center">
                  <svg className="w-5 h-5 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
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

          {/* Recent captures */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-widest text-muted-brand uppercase">
                Recent captures
              </p>
              <Link href="/captures" className="text-xs font-semibold text-terra">
                View all
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
              {recent_captures.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-brand">
                  No captures yet. Tap + New Capture to start!
                </div>
              ) : (
                recent_captures.map((capture, i) => (
                  <div key={capture.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-lg">
                      {['🍲', '🍗', '🥘', '🍛', '🥗'][i % 5]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{capture.name}</p>
                      <p className="text-xs text-muted-brand truncate">
                        {capture.zone_name ?? 'Unknown zone'} · {timeAgo(capture.created_at)}
                      </p>
                    </div>
                    <TagChip tag={capture.tag} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Bottom nav ─────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <div className="max-w-md mx-auto bg-white border-t border-line flex items-stretch px-2">
            {navItems.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
