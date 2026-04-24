'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Week {
  id: string; title: string; start_date: string; end_date: string
  week_number: number; status: string; asset_count: number
  general_instructions: string | null
}

interface Props {
  weeks: Week[]
  isAdmin: boolean
  onWeekCreated: (w: Week) => void
}

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  active:    'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-500 border-gray-200',
}

function NewWeekModal({ onClose, onCreated }: { onClose: () => void; onCreated: (w: Week) => void }) {
  const [title,        setTitle]        = useState('')
  const [weekNumber,   setWeekNumber]   = useState(1)
  const [startDate,    setStartDate]    = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const endDate = startDate
    ? (() => { const d = new Date(startDate + 'T12:00:00'); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10) })()
    : ''

  async function save() {
    if (!title.trim() || !startDate) return
    setSaving(true); setError(null)
    const res = await fetch('/api/content/weeks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), week_number: weekNumber, start_date: startDate, end_date: endDate, general_instructions: instructions.trim() || null, status: 'draft' }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to create week.'); return }
    onCreated(json.week)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">New Content Week</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 1 – Brand Awareness"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Week #</label>
              <input type="number" min={1} value={weekNumber} onChange={e => setWeekNumber(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start date (Monday) <span className="text-red-400">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400" />
            </div>
          </div>
          {endDate && <p className="text-xs text-gray-400">End date (Sunday): <strong>{new Date(endDate + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Weekly strategy notes</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
              placeholder="E.g. This week focus on testimonial content. Post reels at 9am and 6pm for max engagement…"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-none" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500">Cancel</button>
          <button onClick={save} disabled={!title.trim() || !startDate || saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#1B5E20' }}>
            {saving ? 'Creating…' : 'Create Week'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CalendarView({ weeks, isAdmin, onWeekCreated }: Props) {
  const router    = useRouter()
  const [showNew, setShowNew] = useState(false)

  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Content Calendar</h2>
        {isAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1B5E20' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Week
          </button>
        )}
      </div>

      {weeks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-12 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-semibold text-gray-700">No weeks yet</p>
          {isAdmin && <p className="text-xs text-gray-400 mt-1">Click &quot;+ New Week&quot; to set up your first content week.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map(w => (
            <button
              key={w.id}
              onClick={() => router.push(`/content-hub?weekId=${w.id}`)}
              className="w-full bg-white rounded-2xl border border-green-100 px-5 py-4 text-left hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Week {w.week_number}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[w.status] ?? STATUS_STYLE.draft}`}>{w.status}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm truncate">{w.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(w.start_date)} – {fmt(w.end_date)}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-bold text-green-700">{w.asset_count}</p>
                  <p className="text-[10px] text-gray-400">assets</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && <NewWeekModal onClose={() => setShowNew(false)} onCreated={w => { onWeekCreated(w); setShowNew(false) }} />}
    </div>
  )
}
