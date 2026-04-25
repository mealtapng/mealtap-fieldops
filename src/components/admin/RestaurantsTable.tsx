'use client'

import { useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Restaurant {
  id:          string
  name:        string
  owner_name:  string
  owner_phone: string
  cuisine_type: string | null
  zone_name:   string | null
  agent_name:  string
  tag:         string
  avg_meal_price_naira: number | null
  created_at:  string
}

interface Props {
  restaurants: Restaurant[]
  total:       number
}

// ── Config ────────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  hot:       'bg-terra-light text-terra border border-terra/20',
  warm:      'bg-forest-light text-forest border border-forest/20',
  cold:      'bg-line text-muted border border-line',
  not_a_fit: 'bg-red-50 text-red-500 border border-red-100',
}

const TAG_LABELS: Record<string, string> = {
  hot:       '🔥 Hot',
  warm:      '✅ Warm',
  cold:      '❄️ Cold',
  not_a_fit: '✕ Not a fit',
}

const TAG_FILTERS = ['all', 'hot', 'warm', 'cold', 'not_a_fit'] as const

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Main component ────────────────────────────────────────────────────────────

export function RestaurantsTable({ restaurants, total }: Props) {
  const [filter, setFilter] = useState<typeof TAG_FILTERS[number]>('all')
  const [search, setSearch] = useState('')

  const filtered = restaurants.filter(r => {
    if (filter !== 'all' && r.tag !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q) ||
        r.owner_phone.includes(q) ||
        r.agent_name.toLowerCase().includes(q) ||
        (r.zone_name ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div>
            <h1 className="text-2xl font-bold text-forest">Restaurants 🍽️</h1>
            <p className="text-sm text-muted">{total} total capture{total !== 1 ? 's' : ''}</p>
          </div>
          <a
            href="/api/admin/export-restaurants"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line text-sm font-semibold text-muted hover:border-forest hover:text-forest transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </a>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-line bg-cream/30 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurant, agent, zone…"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-line text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {TAG_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === t
                    ? 'bg-forest text-white'
                    : 'text-muted hover:text-ink hover:bg-line/50'
                }`}
              >
                {t === 'not_a_fit' ? 'Not a fit' : t === 'all' ? 'All' : TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/50">
                {['Restaurant', 'Owner', 'Phone', 'Cuisine', 'Zone', 'Agent', 'Tag', 'Avg Price', 'Time'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-muted uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted">
                    No restaurants match your filters
                  </td>
                </tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/restaurants/${row.id}`} className="text-sm font-semibold text-ink hover:text-forest transition-colors">
                      {row.name}
                    </Link>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-muted">{row.owner_name}</td>

                  <td className="px-5 py-3.5 text-sm text-muted">{row.owner_phone}</td>

                  <td className="px-5 py-3.5 text-sm text-muted">{row.cuisine_type ?? '—'}</td>

                  <td className="px-5 py-3.5 text-sm text-muted">{row.zone_name ?? '—'}</td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2D5A27, #1F3F1B)' }}>
                        <span className="text-[8px] font-bold text-white">{initials(row.agent_name)}</span>
                      </div>
                      <p className="text-sm text-ink">{row.agent_name}</p>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${TAG_STYLES[row.tag] ?? 'bg-line text-muted'}`}>
                      {TAG_LABELS[row.tag] ?? row.tag}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-ink">
                    {row.avg_meal_price_naira != null ? `₦${row.avg_meal_price_naira.toLocaleString()}` : '—'}
                  </td>

                  <td className="px-5 py-3.5 text-sm text-muted whitespace-nowrap">
                    {timeAgo(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
