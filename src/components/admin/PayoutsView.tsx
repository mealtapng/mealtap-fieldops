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
  agents:        AgentPayout[]
  weeklyMarshal: number
  hotLeadBonus:  number
  totalOwed:     number
  totalPaid:     number
  pendingCount:  number
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function PayoutsView({ agents, hotLeadBonus, totalOwed, totalPaid, pendingCount }: Props) {
  const [paying,  setPaying]  = useState<AgentPayout | null>(null)
  const [amount,  setAmount]  = useState('')
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState<'unpaid' | 'all'>('unpaid')

  const outstanding = totalOwed
  const visible = filter === 'unpaid' ? agents.filter(a => a.net_owed > 0) : agents

  function openPay(agent: AgentPayout) {
    setPaying(agent)
    setAmount(String(agent.net_owed))
    setNote('')
    setError('')
  }

  async function confirmPayout() {
    if (!paying) return
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payouts/record', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId:     paying.id,
          netAmount:   amt,
          hotLeads:    paying.hot_leads,
          hotLeadBonus,
          note:        note.trim() || null,
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
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="text-sm text-muted mt-1">Track earnings and record payments for agents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Total owed</p>
          <p className="text-2xl font-bold text-ink">{fmt(totalOwed)}</p>
          <p className="text-xs text-muted mt-1">₦40,000 salary + ₦{hotLeadBonus.toLocaleString()}/hot lead</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Total paid</p>
          <p className="text-2xl font-bold text-forest">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(outstanding)}</p>
          <p className="text-xs text-amber-600 mt-1">{pendingCount} agent{pendingCount !== 1 ? 's' : ''} owed</p>
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
            {f === 'unpaid' ? 'Owed payment' : 'All agents'}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden divide-y divide-line">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            {filter === 'unpaid' ? 'No agents with outstanding balance.' : 'No agents found.'}
          </p>
        ) : visible.map(agent => (
          <div key={agent.id} className="flex items-center gap-4 px-5 py-4 hover:bg-cream/40 transition-colors">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-forest-dark flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials(agent.full_name)}</span>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
              <p className="text-xs text-muted">
                {agent.employee_id ?? '—'}{agent.zone_name ? ` · ${agent.zone_name}` : ''}
              </p>
              {agent.bank_name ? (
                <p className="text-xs text-muted mt-0.5">
                  {agent.bank_name}{agent.bank_account_masked ? ` · ${agent.bank_account_masked}` : ''}
                </p>
              ) : (
                <p className="text-xs text-red-400 mt-0.5">No bank details</p>
              )}
            </div>

            {/* Amount owed */}
            {agent.net_owed > 0 && (
              <p className="text-sm font-bold text-ink flex-shrink-0">{fmt(agent.net_owed)}</p>
            )}

            {/* Action */}
            <div className="flex-shrink-0">
              {agent.net_owed > 0 ? (
                <button
                  onClick={() => openPay(agent)}
                  className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold transition-colors"
                  style={{ background: '#2D5A27' }}
                >
                  Pay
                </button>
              ) : (
                <span className="text-xs text-muted">Paid up</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Record payout</h2>
            <p className="text-sm text-muted mb-5">
              {paying.full_name} · Outstanding:{' '}
              <span className="font-bold text-terra">{fmt(paying.net_owed)}</span>
            </p>

            {!paying.bank_name && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                No bank details on file. Make sure you have their account info before transferring.
              </p>
            )}

            <div className="mb-4">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
                Amount (₦)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
                placeholder="e.g. Bank transfer — April week 2"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setPaying(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayout}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#2D5A27' }}
              >
                {saving ? 'Saving…' : 'Confirm payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
