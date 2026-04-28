'use client'

import { useState } from 'react'
import { formatPhone, formatDate } from '@/lib/format'

interface Props {
  fullName: string
  employeeId: string
  role: string
  phone: string
  email: string | null
  dateOfBirth: string | null
  homeAddress: string | null
  nextOfKinName: string | null
  nextOfKinPhone: string | null
}

interface Draft {
  email: string
  dateOfBirth: string
  homeAddress: string
  nextOfKinName: string
  nextOfKinPhone: string
}

const ROLE_LABELS: Record<string, string> = {
  admin:      'Admin',
  field_lead: 'Field Lead',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-5">
      <span className="text-xs font-semibold text-muted flex-shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{value}</span>
    </div>
  )
}

function EditableRow({
  label,
  value,
  displayValue,
  editing,
  type = 'text',
  inputMode,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  displayValue: React.ReactNode
  editing: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  onChange: (v: string) => void
}) {
  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 py-3.5 px-5">
        <span className="text-xs font-semibold text-muted flex-shrink-0 w-36">{label}</span>
        <span className={`text-sm font-medium text-right ${value ? 'text-ink' : 'text-muted'}`}>
          {displayValue}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-5">
      <span className="text-xs font-semibold text-muted flex-shrink-0 w-36">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm text-right bg-cream border border-line rounded-xl px-3 py-2 outline-none focus:border-forest transition-colors min-w-0 text-ink"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-2">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-line overflow-hidden divide-y divide-line">
        {children}
      </div>
    </div>
  )
}

export function AdminProfileView({
  fullName, employeeId, role, phone,
  email, dateOfBirth, homeAddress, nextOfKinName, nextOfKinPhone,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [saved, setSaved] = useState({ email, dateOfBirth, homeAddress, nextOfKinName, nextOfKinPhone })
  const [draft, setDraft] = useState<Draft>({
    email:         email         ?? '',
    dateOfBirth:   dateOfBirth   ?? '',
    homeAddress:   homeAddress   ?? '',
    nextOfKinName: nextOfKinName ?? '',
    nextOfKinPhone: nextOfKinPhone ?? '',
  })

  function startEdit() {
    setDraft({
      email:          saved.email          ?? '',
      dateOfBirth:    saved.dateOfBirth    ?? '',
      homeAddress:    saved.homeAddress    ?? '',
      nextOfKinName:  saved.nextOfKinName  ?? '',
      nextOfKinPhone: saved.nextOfKinPhone ?? '',
    })
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  function set(field: keyof Draft) {
    return (v: string) => setDraft(d => ({ ...d, [field]: v }))
  }

  async function saveEdit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile/update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:         draft.email         || null,
          dateOfBirth:   draft.dateOfBirth   || null,
          homeAddress:   draft.homeAddress   || null,
          nextOfKinName: draft.nextOfKinName || null,
          nextOfKinPhone: draft.nextOfKinPhone || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setSaved({
        email:          draft.email          || null,
        dateOfBirth:    draft.dateOfBirth    || null,
        homeAddress:    draft.homeAddress    || null,
        nextOfKinName:  draft.nextOfKinName  || null,
        nextOfKinPhone: draft.nextOfKinPhone || null,
      })
      setEditing(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Profile</h1>
          <p className="text-sm text-muted mt-0.5">View and edit your account details</p>
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ background: '#2D5A27' }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="px-5 py-2 rounded-xl text-sm font-semibold border border-line bg-white text-ink hover:border-forest transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 font-medium">{error}</p>
      )}

      <div className="space-y-6">

        {/* Identity card */}
        <div className="bg-white rounded-2xl border border-line p-6 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2D5A27, #1F3F1B)' }}
          >
            {initials(fullName)}
          </div>
          <div>
            <p className="text-xl font-bold text-ink">{fullName}</p>
            <p className="text-sm text-muted mt-0.5">
              {ROLE_LABELS[role] ?? role} · {employeeId}
            </p>
          </div>
        </div>

        <Section title="Contact">
          <InfoRow label="Phone" value={formatPhone(phone)} />
          <EditableRow
            label="Email"
            value={draft.email}
            displayValue={saved.email ?? <span className="text-muted">Not set</span>}
            editing={editing}
            type="email"
            placeholder="your@email.com"
            onChange={set('email')}
          />
        </Section>

        <Section title="Personal">
          <EditableRow
            label="Date of birth"
            value={draft.dateOfBirth}
            displayValue={saved.dateOfBirth ? formatDate(saved.dateOfBirth) : <span className="text-muted">Not set</span>}
            editing={editing}
            type="date"
            onChange={set('dateOfBirth')}
          />
          <EditableRow
            label="Home address"
            value={draft.homeAddress}
            displayValue={saved.homeAddress ?? <span className="text-muted">Not set</span>}
            editing={editing}
            placeholder="123 Main St, Abuja"
            onChange={set('homeAddress')}
          />
        </Section>

        <Section title="Emergency contact">
          <EditableRow
            label="Next of kin"
            value={draft.nextOfKinName}
            displayValue={saved.nextOfKinName ?? <span className="text-muted">Not set</span>}
            editing={editing}
            placeholder="Full name"
            onChange={set('nextOfKinName')}
          />
          <EditableRow
            label="NoK phone"
            value={draft.nextOfKinPhone}
            displayValue={saved.nextOfKinPhone ? formatPhone(saved.nextOfKinPhone) : <span className="text-muted">Not set</span>}
            editing={editing}
            inputMode="tel"
            placeholder="08012345678"
            onChange={set('nextOfKinPhone')}
          />
        </Section>

      </div>
    </div>
  )
}
