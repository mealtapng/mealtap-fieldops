'use client'

import { useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/format'

interface Onboarding {
  id:                string
  user_name:         string
  user_phone:        string | null
  disco_area:        string | null
  conversion_status: string | null
  token_amount:      number | null
  agent_name:        string
  zone_name:         string | null
  created_at:        string
}

interface Props {
  onboardings: Onboarding[]
  total:       number
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-forest-light text-brand border border-forest/20',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-line text-muted border border-line',
}

const STATUS_LABELS: Record<string, string> = {
  converted: '✅ Converted',
  pending:   '⏳ Pending',
  failed:    '✕ Not interested',
}

const STATUS_FILTERS = ['all', 'converted', 'pending', 'failed'] as const

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function OnboardingsTable({ onboardings, total }: Props) {
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [search, setSearch] = useState('')

  const filtered = onboardings.filter(r => {
    if (filter !== 'all' && r.conversion_status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.user_name.toLowerCase().includes(q) ||
        (r.user_phone ?? '').includes(q) ||
        r.agent_name.toLowerCase().includes(q) ||
        (r.disco_area ?? '').toLowerCase().includes(q)
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
            <h1 className="text-2xl font-bold text-brand">Onboardings ⚡</h1>
            <p className="text-sm text-muted">{total} total onboarding{total !== 1 ? 's' : ''}</p>
          </div>
          <a
            href="/api/admin/export-onboardings"
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
        <div className="flex items-center gap-3 px-6 py-3 border-b border-line bg-cream/30">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, agent…"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-line text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === s
                    ? 'bg-brand text-white'
                    : 'text-muted hover:text-ink hover:bg-line/50'
                }`}
              >
                {s === 'failed' ? 'Not interested' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/50">
                {['Customer', 'Phone', 'DISCO', 'Agent', 'Zone', 'Status', 'Token Amt', 'Time'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted">
                    No onboardings match your filters
                  </td>
                </tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-cream/30 transition-colors">
                  {/* Customer */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <Link href={`/admin/onboardings/${row.id}`} className="text-sm font-semibold text-ink hover:text-forest transition-colors">
                        {row.user_name}
                      </Link>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5 text-sm text-muted">{row.user_phone ?? '—'}</td>

                  {/* DISCO */}
                  <td className="px-5 py-3.5 text-sm text-ink">{row.disco_area ?? '—'}</td>

                  {/* Agent */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-white">{initials(row.agent_name)}</span>
                      </div>
                      <p className="text-sm text-ink">{row.agent_name}</p>
                    </div>
                  </td>

                  {/* Zone */}
                  <td className="px-5 py-3.5 text-sm text-muted">{row.zone_name ?? '—'}</td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {row.conversion_status ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[row.conversion_status] ?? 'bg-line text-muted'}`}>
                        {STATUS_LABELS[row.conversion_status] ?? row.conversion_status}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>

                  {/* Token Amount */}
                  <td className="px-5 py-3.5 text-sm text-ink">
                    {row.token_amount != null ? `₦${row.token_amount.toLocaleString()}` : '—'}
                  </td>

                  {/* Time */}
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
