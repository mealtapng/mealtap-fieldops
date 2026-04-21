'use client'

import { useState } from 'react'

interface Agent {
  id:                  string
  full_name:           string
  employee_id:         string
  zone_name:           string | null
  is_active:           boolean
  bank_name:           string | null
  bank_account_masked: string | null
  conversions:         number
  earned:              number
  paid:                number
  outstanding:         number
}

interface Props {
  agents:           Agent[]
  commission:       number
  totalOutstanding: number
  totalPaid:        number
  totalEarned:      number
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function PayoutsView({ agents, commission, totalOutstanding, totalPaid, totalEarned }: Props) {
  const [paying, setPaying]   = useState<Agent | null>(null)
  const [amount, setAmount]   = useState('')
  const [note,   setNote]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')
  const [filter, setFilter]   = useState<'all' | 'owed'>('owed')

  const visible = filter === 'owed'
    ? agents.filter(a => a.outstanding > 0)
    : agents

  function openPay(agent: Agent) {
    setPaying(agent)
    setAmount(String(agent.outstanding))
    setNote('')
    setError('')
  }

  async function submitPayout() {
    if (!paying) return
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payouts/record', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId: paying.id, amount: amt, note: note.trim() || null }),
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
        <p className="text-sm text-muted-brand mt-1">Track earnings and record payments for agents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-ink">{fmt(totalEarned)}</p>
          <p className="text-xs text-muted-brand mt-1">@ {fmt(commission)}/conversion</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-success">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-amber-600 mt-1">{agents.filter(a => a.outstanding > 0).length} agents owed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['owed', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-brand text-white'
                : 'bg-white border border-line text-muted-brand hover:text-ink'
            }`}
          >
            {f === 'owed' ? 'Owed payment' : 'All agents'}
          </button>
        ))}
      </div>

      {/* Agent table */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-brand">
            {filter === 'owed' ? 'No agents with outstanding balance.' : 'No agents found.'}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {visible.map(agent => (
              <div key={agent.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{initials(agent.full_name)}</span>
                </div>

                {/* Name + ID */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
                  <p className="text-xs text-muted-brand">{agent.employee_id}{agent.zone_name ? ` · ${agent.zone_name}` : ''}</p>
                  {agent.bank_name && (
                    <p className="text-xs text-muted-brand mt-0.5">{agent.bank_name} {agent.bank_account_masked ? `· ${agent.bank_account_masked}` : ''}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden sm:flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-brand">Conversions</p>
                    <p className="text-sm font-semibold text-ink">{agent.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-brand">Earned</p>
                    <p className="text-sm font-semibold text-ink">{fmt(agent.earned)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-brand">Paid</p>
                    <p className="text-sm font-semibold text-success">{fmt(agent.paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-brand">Outstanding</p>
                    <p className={`text-sm font-bold ${agent.outstanding > 0 ? 'text-amber-600' : 'text-muted-brand'}`}>
                      {fmt(agent.outstanding)}
                    </p>
                  </div>
                </div>

                {/* Pay button */}
                {agent.outstanding > 0 && (
                  <button
                    onClick={() => openPay(agent)}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex-shrink-0"
                  >
                    Pay
                  </button>
                )}
                {agent.outstanding === 0 && agent.paid > 0 && (
                  <span className="ml-2 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold flex-shrink-0">
                    Paid up
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout modal */}
      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Record payout</h2>
            <p className="text-sm text-muted-brand mb-5">
              {paying.full_name} · Outstanding: <span className="font-semibold text-amber-600">{fmt(paying.outstanding)}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-brand uppercase tracking-wider block mb-1.5">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-brand uppercase tracking-wider block mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success"
                  placeholder="e.g. Bank transfer — April week 2"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPaying(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPayout}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
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
