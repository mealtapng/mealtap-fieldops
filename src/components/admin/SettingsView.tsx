'use client'

import { useState } from 'react'

interface Zone {
  id:         string
  name:       string
  center_lat: number | null
  center_lng: number | null
}

interface Props {
  settings: {
    daily_target:   string
    weekly_salary:  string
    hot_lead_bonus: string
  }
  zones: Zone[]
}

export function SettingsView({ settings, zones: initialZones }: Props) {
  const [dailyTarget,  setDailyTarget]  = useState(settings.daily_target)
  const [weeklySalary, setWeeklySalary] = useState(settings.weekly_salary)
  const [hotBonus,     setHotBonus]     = useState(settings.hot_lead_bonus)
  const [savingConf,   setSavingConf]   = useState(false)
  const [savedConf,    setSavedConf]    = useState(false)
  const [confError,    setConfError]    = useState('')

  const [zones,      setZones]      = useState<Zone[]>(initialZones)
  const [newZone,    setNewZone]    = useState('')
  const [addingZone, setAddingZone] = useState(false)
  const [zoneError,  setZoneError]  = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function saveConfig() {
    setSavingConf(true)
    setSavedConf(false)
    setConfError('')
    try {
      const res = await fetch('/api/admin/settings/update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          daily_target:   dailyTarget,
          weekly_salary:  weeklySalary,
          hot_lead_bonus: hotBonus,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setConfError(d.error ?? 'Failed to save')
        return
      }
      setSavedConf(true)
      setTimeout(() => setSavedConf(false), 2500)
    } finally {
      setSavingConf(false)
    }
  }

  async function addZone() {
    const name = newZone.trim()
    if (!name) return
    setAddingZone(true)
    setZoneError('')
    try {
      const res = await fetch('/api/admin/zones/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      const d = await res.json()
      if (!res.ok) { setZoneError(d.error ?? 'Failed to create zone'); return }
      setZones(prev => [...prev, d.zone].sort((a, b) => a.name.localeCompare(b.name)))
      setNewZone('')
    } finally {
      setAddingZone(false)
    }
  }

  async function deleteZone(id: string) {
    if (!confirm('Delete this zone? Agents assigned to it will be unassigned.')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/zones/delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      if (!res.ok) { alert('Failed to delete zone'); return }
      setZones(prev => prev.filter(z => z.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const inputCls = 'w-full max-w-xs rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest'

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted mt-1">Configure app-wide defaults</p>
      </div>

      {/* Targets & Compensation */}
      <section className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <p className="font-bold text-ink">Targets &amp; Compensation</p>
          <p className="text-xs text-muted mt-0.5">How agent targets and bonuses are calculated</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
              Daily capture target per agent
            </label>
            <input type="number" min="1" value={dailyTarget} onChange={e => setDailyTarget(e.target.value)} className={inputCls} />
            <p className="text-xs text-muted mt-1">Used in the agent dashboard progress ring</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
              Weekly salary (₦)
            </label>
            <input type="number" min="0" value={weeklySalary} onChange={e => setWeeklySalary(e.target.value)} className={inputCls} />
            <p className="text-xs text-muted mt-1">Fixed weekly amount paid regardless of captures</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
              Hot lead bonus per restaurant (₦)
            </label>
            <input type="number" min="0" value={hotBonus} onChange={e => setHotBonus(e.target.value)} className={inputCls} />
            <p className="text-xs text-muted mt-1">Paid for each restaurant tagged 🔥 Hot</p>
          </div>

          {confError && <p className="text-xs text-red-500 font-medium">{confError}</p>}

          <button
            onClick={saveConfig}
            disabled={savingConf}
            className="px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            {savingConf ? 'Saving…' : savedConf ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Zone management */}
      <section className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <p className="font-bold text-ink">Zones</p>
          <p className="text-xs text-muted mt-0.5">Geographic zones used to group agents and restaurants</p>
        </div>

        <div className="divide-y divide-line">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{zone.name}</p>
                {(zone.center_lat && zone.center_lng) && (
                  <p className="text-xs text-muted">{zone.center_lat.toFixed(4)}, {zone.center_lng.toFixed(4)}</p>
                )}
              </div>
              <button
                onClick={() => deleteZone(zone.id)}
                disabled={deletingId === zone.id}
                className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                {deletingId === zone.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ))}
          {zones.length === 0 && (
            <div className="px-6 py-4 text-sm text-muted">No zones yet.</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line bg-cream/30">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Add zone</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newZone}
              onChange={e => setNewZone(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addZone() }}
              placeholder="Zone name e.g. Lekki Phase 1"
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
            <button
              onClick={addZone}
              disabled={addingZone || !newZone.trim()}
              className="px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition-colors disabled:opacity-50"
            >
              {addingZone ? 'Adding…' : 'Add'}
            </button>
          </div>
          {zoneError && <p className="text-xs text-red-500 mt-1">{zoneError}</p>}
        </div>
      </section>

      {/* App Info */}
      <section className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <p className="font-bold text-ink">App Info</p>
        </div>
        <div className="divide-y divide-line">
          {[
            { label: 'App',     value: 'Mealtap Field Ops' },
            { label: 'Version', value: 'v1.0' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
