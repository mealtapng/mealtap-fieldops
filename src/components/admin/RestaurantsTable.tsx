'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo, formatNaira } from '@/lib/format'

interface Restaurant {
  id:                   string
  name:                 string
  owner_name:           string | null
  owner_phone:          string | null
  address:              string | null
  cuisine_type:         string | null
  avg_meal_price_naira: number | null
  tag:                  string | null
  zone_id:              string | null
  zone_name:            string | null
  agent_id:             string
  agent_name:           string
  quality_score:        number | null
  created_at:           string
}

interface Zone   { id: string; name: string }
interface Agent  { id: string; name: string }

interface Props {
  restaurants: Restaurant[]
  zones:       Zone[]
  agents:      Agent[]
}

const TAG_STYLES: Record<string, string> = {
  hot:       'bg-terra-light text-terra border border-terra/30',
  warm:      'bg-forest-light text-forest border border-forest/30',
  cold:      'bg-line text-muted-brand border border-line',
  not_a_fit: 'bg-red-50 text-red-500 border border-red-200',
}

const TAG_LABELS: Record<string, string> = {
  hot:       '🔥 Hot',
  warm:      '☀️ Warm',
  cold:      '❄️ Cold',
  not_a_fit: '✕ Not a fit',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function RestaurantsTable({ restaurants, zones, agents }: Props) {
  const router = useRouter()

  const [zoneFilter,   setZoneFilter]   = useState('')
  const [tagFilter,    setTagFilter]    = useState('')
  const [agentFilter,  setAgentFilter]  = useState('')
  const [search,       setSearch]       = useState('')

  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      if (zoneFilter  && r.zone_id   !== zoneFilter)                                          return false
      if (tagFilter   && r.tag       !== tagFilter)                                            return false
      if (agentFilter && r.agent_id  !== agentFilter)                                          return false
      if (search      && !r.name.toLowerCase().includes(search.toLowerCase()))                 return false
      return true
    })
  }, [restaurants, zoneFilter, tagFilter, agentFilter, search])

  const selectClass = 'px-3 py-2 rounded-xl border border-line text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest'

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div>
            <h1 className="text-2xl font-bold text-forest">Restaurants</h1>
            <p className="text-sm text-muted-brand">
              {filtered.length} of {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <a
            href="/api/admin/export-restaurants"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:border-forest hover:text-forest transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </a>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-line bg-cream/30">
          {/* Zone */}
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className={selectClass}>
            <option value="">All zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>

          {/* Tag */}
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className={selectClass}>
            <option value="">All tags</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">☀️ Warm</option>
            <option value="cold">❄️ Cold</option>
            <option value="not_a_fit">✕ Not a fit</option>
          </select>

          {/* Agent */}
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className={selectClass}>
            <option value="">All agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-line text-sm text-ink placeholder:text-muted-brand/50 bg-white focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
          </div>

          {/* Clear */}
          {(zoneFilter || tagFilter || agentFilter || search) && (
            <button
              onClick={() => { setZoneFilter(''); setTagFilter(''); setAgentFilter(''); setSearch('') }}
              className="text-sm text-muted-brand hover:text-ink transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/50">
                {['Restaurant', 'Owner', 'Phone', 'Zone', 'Agent', 'Tag', 'Cuisine', 'Avg Price', 'Date'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider whitespace-nowrap first:pl-6 last:pr-6">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-brand">
                    No restaurants match your filters.
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/admin/restaurants/${r.id}`)}
                  className="hover:bg-cream/30 transition-colors cursor-pointer"
                >
                  {/* Restaurant */}
                  <td className="pl-6 pr-4 py-3.5">
                    <p className="text-sm font-semibold text-ink leading-tight">{r.name}</p>
                    {r.address && (
                      <p className="text-xs text-muted-brand truncate max-w-[200px]">{r.address}</p>
                    )}
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3.5 text-sm text-ink whitespace-nowrap">{r.owner_name ?? '—'}</td>

                  {/* Phone */}
                  <td className="px-4 py-3.5 text-sm text-ink whitespace-nowrap">{r.owner_phone ?? '—'}</td>

                  {/* Zone */}
                  <td className="px-4 py-3.5 text-sm text-ink whitespace-nowrap">{r.zone_name ?? '—'}</td>

                  {/* Agent */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{initials(r.agent_name)}</span>
                      </div>
                      <span className="text-sm text-ink">{r.agent_name}</span>
                    </div>
                  </td>

                  {/* Tag */}
                  <td className="px-4 py-3.5">
                    {r.tag ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${TAG_STYLES[r.tag] ?? 'bg-line text-muted-brand'}`}>
                        {TAG_LABELS[r.tag] ?? r.tag}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-brand">—</span>
                    )}
                  </td>

                  {/* Cuisine */}
                  <td className="px-4 py-3.5 text-sm text-ink whitespace-nowrap">{r.cuisine_type ?? '—'}</td>

                  {/* Avg Price */}
                  <td className="px-4 py-3.5 text-sm text-ink whitespace-nowrap">
                    {r.avg_meal_price_naira != null ? formatNaira(r.avg_meal_price_naira) : '—'}
                  </td>

                  {/* Date */}
                  <td className="px-4 pr-6 py-3.5 text-sm text-muted-brand whitespace-nowrap">
                    {timeAgo(r.created_at)}
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
