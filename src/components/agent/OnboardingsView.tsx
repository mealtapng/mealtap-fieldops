'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BottomNav } from './BottomNav'

interface Capture {
  id:         string
  name:       string
  zone_name:  string | null
  tag:        string | null
  created_at: string
  owner_phone: string
}

const TAG_STYLES: Record<string, string> = {
  hot:       'bg-terra-light text-terra',
  warm:      'bg-forest-light text-forest',
  cold:      'bg-line text-muted',
  not_a_fit: 'bg-red-50 text-red-500',
}
const TAG_LABELS: Record<string, string> = {
  hot:       '🔥 Hot',
  warm:      '🌿 Warm',
  cold:      '❄️ Cold',
  not_a_fit: '✕ Not a fit',
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

type Filter = 'all' | 'hot' | 'warm' | 'cold' | 'not_a_fit'

export function OnboardingsView({ captures }: { captures: Capture[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? captures : captures.filter(c => c.tag === filter)

  const counts = {
    all:       captures.length,
    hot:       captures.filter(c => c.tag === 'hot').length,
    warm:      captures.filter(c => c.tag === 'warm').length,
    cold:      captures.filter(c => c.tag === 'cold').length,
    not_a_fit: captures.filter(c => c.tag === 'not_a_fit').length,
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col min-h-screen">

        {/* Header */}
        <div className="px-4 pt-12 pb-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-line text-muted active:bg-cream"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">My Captures</h1>
            <p className="text-xs text-muted">{counts.all} total · {counts.hot} hot leads</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0">
          {(['all', 'hot', 'warm', 'cold', 'not_a_fit'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f
                  ? f === 'hot'       ? 'bg-terra text-white'
                  : f === 'warm'      ? 'bg-forest text-white'
                  : f === 'cold'      ? 'bg-gray-500 text-white'
                  : f === 'not_a_fit' ? 'bg-red-500 text-white'
                  : 'bg-ink text-white'
                  : 'bg-white border border-line text-muted'
              }`}
            >
              {f === 'all'       ? `All (${counts.all})`
               : f === 'hot'       ? `🔥 Hot (${counts.hot})`
               : f === 'warm'      ? `🌿 Warm (${counts.warm})`
               : f === 'cold'      ? `❄️ Cold (${counts.cold})`
               : `✕ Not a fit (${counts.not_a_fit})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm font-semibold text-ink">No captures here</p>
              <p className="text-xs text-muted mt-1">
                {filter === 'all' ? 'Start your first capture!' : `No ${TAG_LABELS[filter]?.toLowerCase()} captures yet.`}
              </p>
              {filter === 'all' && (
                <Link
                  href="/onboard"
                  className="mt-4 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                  style={{ background: '#C8622A' }}
                >
                  + New Capture
                </Link>
              )}
            </div>
          ) : (
            visible.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-lg mt-0.5">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                    {c.tag && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_STYLES[c.tag] ?? 'bg-line text-muted'}`}>
                        {TAG_LABELS[c.tag] ?? c.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {c.owner_phone}
                    {c.zone_name ? ` · ${c.zone_name}` : ''}
                  </p>
                  <p className="text-[10px] text-muted/70 mt-0.5">{timeAgo(c.created_at)}</p>
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
