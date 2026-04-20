'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Agent {
  id:                 string
  full_name:          string
  employee_id:        string | null
  phone:              string | null
  role:               string
  zone_name:          string | null
  quality_score:      number | null
  is_active:          boolean
  passport_photo_url: string | null
  total_onboardings:  number
  conversions:        number
}

interface Zone {
  id:   string
  name: string
}

interface Props {
  agents: Agent[]
  zones:  Zone[]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function qualityColor(score: number | null) {
  if (score == null) return 'text-muted-brand'
  if (score >= 90) return 'text-brand font-semibold'
  if (score >= 70) return 'text-amber-600 font-semibold'
  return 'text-red-500 font-semibold'
}

const ROLE_LABELS: Record<string, string> = {
  agent:      'Agent',
  field_lead: 'Field Lead',
}

export function AgentsTable({ agents, zones }: Props) {
  const [showModal,   setShowModal]   = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdPin,  setCreatedPin]  = useState('')
  const [copied,      setCopied]      = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [role,     setRole]     = useState<'agent' | 'field_lead'>('agent')
  const [zoneId,   setZoneId]   = useState('')
  const [pin,      setPin]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  function resetForm() {
    setFullName('')
    setPhone('')
    setRole('agent')
    setZoneId('')
    setPin('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/agents/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fullName, phone, role, zoneId: zoneId || null, pin: pin || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setCreatedPin(data.pin)
      setShowModal(false)
      setShowSuccess(true)
      resetForm()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(createdPin).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div>
            <h1 className="text-2xl font-bold text-brand">Agents</h1>
            <p className="text-sm text-muted-brand">{agents.length} field agent{agents.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-success text-white rounded-xl font-semibold text-sm hover:bg-success-dark transition-colors"
          >
            + New Agent
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-cream/50">
                <th className="text-left px-6 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Zone</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Onboardings</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Conversions</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Quality</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-muted-brand uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-brand">
                    No agents yet. Click &quot;+ New Agent&quot; to add one.
                  </td>
                </tr>
              ) : agents.map(agent => (
                <tr key={agent.id} className="hover:bg-cream/30 transition-colors">
                  {/* Agent */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {agent.passport_photo_url ? (
                        <img
                          src={agent.passport_photo_url}
                          alt={agent.full_name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{initials(agent.full_name)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-ink text-sm">{agent.full_name}</p>
                        <p className="text-xs text-muted-brand">
                          {agent.employee_id ?? '—'} · {ROLE_LABELS[agent.role] ?? agent.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-4 text-sm text-ink">{agent.phone ?? '—'}</td>

                  {/* Zone */}
                  <td className="px-4 py-4 text-sm text-ink">{agent.zone_name ?? <span className="text-muted-brand">—</span>}</td>

                  {/* Onboardings */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-semibold text-ink">{agent.total_onboardings}</span>
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-semibold text-success">{agent.conversions}</span>
                  </td>

                  {/* Quality */}
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm ${qualityColor(agent.quality_score)}`}>
                      {agent.quality_score != null ? `${agent.quality_score}%` : '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      agent.is_active
                        ? 'bg-brand/10 text-brand'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/agents/${agent.id}`}
                      className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Agent Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm() } }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink">New Agent</h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="text-muted-brand hover:text-ink transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-muted-brand uppercase tracking-wider mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Amaka Obi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink placeholder:text-muted-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-muted-brand uppercase tracking-wider mb-1.5">
                  Phone number
                </label>
                <div className="flex">
                  <span className="flex items-center px-3.5 bg-cream border border-r-0 border-line rounded-l-xl text-sm text-muted-brand">
                    +234
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    placeholder="08012345678"
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-line text-sm text-ink placeholder:text-muted-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-muted-brand uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'agent' | 'field_lead')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                >
                  <option value="agent">Agent</option>
                  <option value="field_lead">Field Lead</option>
                </select>
              </div>

              {/* Zone */}
              <div>
                <label className="block text-xs font-semibold text-muted-brand uppercase tracking-wider mb-1.5">
                  Assigned zone <span className="normal-case font-normal">(optional)</span>
                </label>
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                >
                  <option value="">— No zone —</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-xs font-semibold text-muted-brand uppercase tracking-wider mb-1.5">
                  PIN <span className="normal-case font-normal">(optional — auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="4 digits"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink placeholder:text-muted-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:text-ink hover:border-ink/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success-dark disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Creating…' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <p className="text-3xl mb-3">🎉</p>
            <h2 className="text-lg font-bold text-ink mb-1">Agent created!</h2>
            <p className="text-sm text-muted-brand mb-5">Send this PIN to the agent via WhatsApp:</p>

            <div className="bg-cream rounded-xl px-6 py-4 mb-2 flex items-center justify-center gap-4">
              <span className="text-3xl font-mono font-bold text-ink tracking-[0.3em]">{createdPin}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-muted-brand hover:text-ink hover:border-ink/20 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-muted-brand mb-5">
              This PIN will <strong>never</strong> be shown again.
            </p>

            <button
              onClick={() => { setShowSuccess(false); setCopied(false); window.location.reload() }}
              className="w-full px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
