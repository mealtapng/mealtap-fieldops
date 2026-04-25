'use client'

import Link from 'next/link'
import { BottomNav } from './BottomNav'

interface Onboarding {
  id:                string
  user_name:         string
  disco_area:        string | null
  conversion_status: string | null
  created_at:        string
}

interface Props {
  zone:        { name: string; center_lat: number | null; center_lng: number | null }
  stats:       { total: number; converted: number; pending: number }
  onboardings: Onboarding[]
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-terra-light text-success',
  pending:   'bg-amber-50 text-amber-700',
  failed:    'bg-line text-muted',
}
const STATUS_LABELS: Record<string, string> = {
  converted: 'Converted',
  pending:   'Pending',
  failed:    'Not interested',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ZoneView({ zone, stats, onboardings }: Props) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col min-h-screen">

        {/* Header */}
        <div className="px-4 pt-12 pb-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-line text-muted active:bg-cream"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Today&apos;s zone</p>
            <h1 className="text-xl font-bold text-ink leading-tight">{zone.name}</h1>
          </div>
        </div>

        <div className="flex-1 px-4 pb-28 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-ink">{stats.total}</p>
              <p className="text-[10px] text-muted font-semibold uppercase tracking-wide mt-0.5">Total</p>
            </div>
            <div className="bg-terra-light rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-success">{stats.converted}</p>
              <p className="text-[10px] text-success/80 font-semibold uppercase tracking-wide mt-0.5">Converted</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] text-amber-600/80 font-semibold uppercase tracking-wide mt-0.5">Pending</p>
            </div>
          </div>

          {/* Start new onboarding CTA */}
          <Link
            href="/onboard"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all"
            style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Onboarding in {zone.name}
          </Link>

          {/* Onboardings list */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-2">
              Your onboardings here
            </p>

            {onboardings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <p className="text-3xl mb-2">📍</p>
                <p className="text-sm font-semibold text-ink">No onboardings in this zone yet</p>
                <p className="text-xs text-muted mt-1">Start your first one with the button above.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
                {onboardings.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-lg">
                      {['⚡', '🔌', '💡', '🔋', '📱'][i % 5]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{o.user_name}</p>
                      <p className="text-xs text-muted">{o.disco_area ?? 'Unknown DISCO'} · {timeAgo(o.created_at)}</p>
                    </div>
                    {o.conversion_status && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[o.conversion_status] ?? 'bg-line text-muted'}`}>
                        {STATUS_LABELS[o.conversion_status] ?? o.conversion_status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
