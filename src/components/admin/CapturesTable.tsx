'use client'

import { timeAgo } from '@/lib/format'

interface Capture {
  id:            string
  name:          string
  address:       string | null
  tag:           string | null
  quality_score: number | null
  created_at:    string
  agent_name:    string
  zone_name:     string | null
}

interface Props {
  captures: Capture[]
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

export function CapturesTable({ captures }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <p className="font-bold text-ink">Recent captures</p>
        <a
          href="/api/admin/export-restaurants"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:border-forest hover:text-forest transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-cream/50">
              {['Restaurant', 'Zone', 'Agent', 'Tag', 'Quality', 'Time'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-[10px] font-bold tracking-widest text-muted-brand uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {captures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-brand">
                  No captures yet
                </td>
              </tr>
            ) : (
              captures.map(row => (
                <tr key={row.id} className="hover:bg-cream/30 transition-colors">
                  {/* Restaurant */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🍽️</span>
                      <div>
                        <p className="text-sm font-semibold text-ink leading-tight">{row.name}</p>
                        {row.address && (
                          <p className="text-[11px] text-muted-brand truncate max-w-[200px]">{row.address}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Zone */}
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-ink">{row.zone_name ?? '—'}</p>
                  </td>

                  {/* Agent */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{initials(row.agent_name)}</span>
                      </div>
                      <p className="text-sm text-ink">{row.agent_name}</p>
                    </div>
                  </td>

                  {/* Tag */}
                  <td className="px-6 py-3.5">
                    {row.tag ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${TAG_STYLES[row.tag] ?? 'bg-line text-muted-brand'}`}>
                        {TAG_LABELS[row.tag] ?? row.tag}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-brand">—</span>
                    )}
                  </td>

                  {/* Quality */}
                  <td className="px-6 py-3.5">
                    <p className={`text-sm font-semibold ${
                      (row.quality_score ?? 0) >= 80 ? 'text-forest' :
                      (row.quality_score ?? 0) >= 50 ? 'text-terra' : 'text-red-500'
                    }`}>
                      {row.quality_score != null ? `${row.quality_score}` : '—'}
                    </p>
                  </td>

                  {/* Time */}
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-muted-brand whitespace-nowrap">{timeAgo(row.created_at)}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
