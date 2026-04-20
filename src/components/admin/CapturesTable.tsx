'use client'

import { timeAgo } from '@/lib/format'

interface Onboarding {
  id:                string
  name:              string
  disco_area:        string | null
  conversion_status: string | null
  created_at:        string
  agent_name:        string
  zone_name:         string | null
}

interface Props {
  captures: Onboarding[]
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-success-light text-success border border-success/30',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-line text-muted-brand border border-line',
}

const STATUS_LABELS: Record<string, string> = {
  converted: '✅ Converted',
  pending:   '⏳ Pending',
  failed:    '✕ Not interested',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function CapturesTable({ captures }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <p className="font-bold text-ink">Recent onboardings</p>
        <a
          href="/api/admin/export-onboardings"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:border-brand hover:text-brand transition-colors"
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
              {['Customer', 'DISCO', 'Agent', 'Status', 'Time'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-[10px] font-bold tracking-widest text-muted-brand uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {captures.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-brand">
                  No onboardings yet
                </td>
              </tr>
            ) : (
              captures.map(row => (
                <tr key={row.id} className="hover:bg-cream/30 transition-colors">
                  {/* Customer */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">⚡</span>
                      <p className="text-sm font-semibold text-ink leading-tight">{row.name}</p>
                    </div>
                  </td>

                  {/* DISCO */}
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-ink">{row.disco_area ?? '—'}</p>
                  </td>

                  {/* Agent */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{initials(row.agent_name)}</span>
                      </div>
                      <p className="text-sm text-ink">{row.agent_name}</p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    {row.conversion_status ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[row.conversion_status] ?? 'bg-line text-muted-brand'}`}>
                        {STATUS_LABELS[row.conversion_status] ?? row.conversion_status}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-brand">—</span>
                    )}
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
