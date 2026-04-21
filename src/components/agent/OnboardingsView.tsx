'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BottomNav } from './BottomNav'

interface Onboarding {
  id:                string
  user_name:         string
  user_phone:        string
  disco_area:        string | null
  conversion_status: string | null
  created_at:        string
  zone_name:         string | null
  meter_number:      string | null
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-success-light text-success',
  pending:   'bg-amber-50 text-amber-700',
  failed:    'bg-line text-muted-brand',
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
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Filter = 'all' | 'converted' | 'pending' | 'failed'

export function OnboardingsView({ onboardings }: { onboardings: Onboarding[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? onboardings : onboardings.filter(o => o.conversion_status === filter)

  const counts = {
    all:       onboardings.length,
    converted: onboardings.filter(o => o.conversion_status === 'converted').length,
    pending:   onboardings.filter(o => o.conversion_status === 'pending').length,
    failed:    onboardings.filter(o => o.conversion_status === 'failed').length,
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col min-h-screen">

        {/* Header */}
        <div className="px-4 pt-12 pb-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-line text-muted-brand active:bg-cream"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">My Onboardings</h1>
            <p className="text-xs text-muted-brand">{counts.all} total · {counts.converted} converted</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0">
          {(['all', 'converted', 'pending', 'failed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f
                  ? f === 'converted' ? 'bg-success text-white'
                  : f === 'pending'   ? 'bg-amber-500 text-white'
                  : f === 'failed'    ? 'bg-gray-500 text-white'
                  : 'bg-ink text-white'
                  : 'bg-white border border-line text-muted-brand'
              }`}
            >
              {f === 'all' ? `All (${counts.all})`
                : f === 'converted' ? `Converted (${counts.converted})`
                : f === 'pending'   ? `Pending (${counts.pending})`
                : `Not interested (${counts.failed})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-3xl mb-2">⚡</p>
              <p className="text-sm font-semibold text-ink">No onboardings here</p>
              <p className="text-xs text-muted-brand mt-1">
                {filter === 'all' ? 'Start your first onboarding!' : `No ${STATUS_LABELS[filter]?.toLowerCase()} onboardings yet.`}
              </p>
              {filter === 'all' && (
                <Link
                  href="/onboard"
                  className="mt-4 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                  style={{ background: '#25D366' }}
                >
                  + New Onboarding
                </Link>
              )}
            </div>
          ) : (
            visible.map((o, i) => (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-lg mt-0.5">
                  {['⚡', '🔌', '💡', '🔋', '📱'][i % 5]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink truncate">{o.user_name}</p>
                    {o.conversion_status && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[o.conversion_status] ?? 'bg-line text-muted-brand'}`}>
                        {STATUS_LABELS[o.conversion_status] ?? o.conversion_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-brand mt-0.5">
                    {o.user_phone}
                    {o.disco_area ? ` · ${o.disco_area}` : ''}
                    {o.zone_name  ? ` · ${o.zone_name}`  : ''}
                  </p>
                  {o.meter_number && (
                    <p className="text-xs text-muted-brand">Meter: {o.meter_number}</p>
                  )}
                  <p className="text-[10px] text-muted-brand/70 mt-0.5">{timeAgo(o.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
