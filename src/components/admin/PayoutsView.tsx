'use client'

import { useState } from 'react'

interface AgentPayout {
  id:                  string
  full_name:           string
  employee_id:         string | null
  zone_name:           string | null
  is_active:           boolean
  bank_name:           string | null
  bank_account_masked: string | null
  total_captures:      number
  hot_leads:           number
  salary_owed:         number
  hot_lead_bonus:      number
  deductions:          number
  net_owed:            number
  last_paid_at:        string | null
  status:              'unpaid' | 'processing' | 'paid'
}

interface Props {
  agents:          AgentPayout[]
  weeklyMarshal:   number
  hotLeadBonus:    number
  totalOwed:       number
  totalPaid:       number
  pendingCount:    number
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const STATUS_STYLES: Record<string, string> = {
  unpaid:     'bg-red-50 text-red-500',
  processing: 'bg-amber-50 text-amber-700',
  paid:       'bg-forest-light text-forest',
}

export function PayoutsView({ agents, hotLeadBonus, totalOwed, totalPaid, pendingCount }: Props) {
  const [paying,  setPaying]  = useState<AgentPayout | null>(null)
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState<'unpaid' | 'all'>('unpaid')

  const visible = filter === 'unpaid' ? agents.filter(a => a.net_owed > 0) : agents

  function openPay(agent: AgentPayout) {
    setPaying(agent)
    setNote('')
    setError('')
  }

  async function confirmPayout() {
    if (!paying) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payouts/record', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          agentId:  paying.id,
          netAmount: paying.net_owed,
          hotLeads: paying.hot_leads,
          hotLeadBonus,
          note: note.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to record payout')
        return
      }
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="text-sm text-muted mt-1">Track earnings and record payments for agents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Total owed</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(totalOwed)}</p>
          <p className="text-xs text-amber-600 mt-1">{pendingCount} agent{pendingCount !== 1 ? 's' : ''} pending</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Total paid (all time)</p>
          <p className="text-2xl font-bold text-forest">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Bonus rate</p>
          <p className="text-2xl font-bold text-terra">{fmt(hotLeadBonus)}</p>
          <p className="text-xs text-muted mt-1">per hot lead</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['unpaid', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-forest text-white'
                : 'bg-white border border-line text-muted hover:text-ink'
            }`}
          >
            {f === 'unpaid' ? 'Unpaid only' : 'All agents'}
          </button>
        ))}
      </div>

      {/* Agent table */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Agent</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Captures</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Hot leads</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Salary</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Hot bonus</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Net owed</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Bank</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold tracking-widest text-muted uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-muted">
                    {filter === 'unpaid' ? 'No agents with outstanding balance.' : 'No agents found.'}
                  </td>
                </tr>
              ) : visible.map(agent => (
                <tr key={agent.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest to-forest-dark flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{initials(agent.full_name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
                        <p className="text-xs text-muted">{agent.employee_id ?? '—'}{agent.zone_name ? ` · ${agent.zone_name}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-ink">{agent.total_captures}</td>
                  <td className="px-4 py-3.5 text-center text-sm font-semibold text-terra">{agent.hot_leads}</td>
                  <td className="px-4 py-3.5 text-right text-sm text-ink">{fmt(agent.salary_owed)}</td>
                  <td className="px-4 py-3.5 text-right text-sm text-terra font-semibold">{fmt(agent.hot_lead_bonus)}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-ink">{fmt(agent.net_owed)}</td>
                  <td className="px-4 py-3.5 text-sm">
                    {agent.bank_name ? (
                      <div>
                        <p className="text-ink text-xs font-medium">{agent.bank_name}</p>
                        <p className="text-muted text-xs">{agent.bank_account_masked ?? 'No acct'}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[agent.status]}`}>
                      {agent.status === 'unpaid' ? 'Unpaid' : agent.status === 'processing' ? 'Processing' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {agent.net_owed > 0 && (
                      <button
                        onClick={() => openPay(agent)}
                        className="px-3 py-1.5 rounded-lg bg-terra text-white text-xs font-semibold hover:bg-terra-dark transition-colors flex-shrink-0"
                      >
                        Pay
                      </button>
                    )}
                    {agent.net_owed === 0 && agent.last_paid_at && (
                      <span className="text-xs text-muted">Paid up</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Confirm payout</h2>
            <p className="text-sm text-muted mb-4">
              Transfer <span className="font-bold text-ink">{fmt(paying.net_owed)}</span> to{' '}
              <span className="font-semibold">{paying.full_name}</span>
              {paying.bank_name && (
                <> at <span className="font-medium">{paying.bank_name}</span>{paying.bank_account_masked ? ` · ${paying.bank_account_masked}` : ''}</>
              )}
            </p>
            {!paying.bank_name && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                No bank details on file for this agent. Make sure you have their account info before transferring.
              </p>
            )}

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
                placeholder="e.g. Bank transfer — Week 2 May"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setPaying(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayout}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-terra text-white text-sm font-semibold hover:bg-terra-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Confirm transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
