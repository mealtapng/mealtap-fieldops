'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPhone, formatDate } from '@/lib/format'
import { PhotoUpload } from '@/components/agent/PhotoUpload'

interface Props {
  userId: string
  fullName: string
  employeeId: string
  role: string
  phone: string
  email: string | null
  dateOfBirth: string | null
  homeAddress: string | null
  nextOfKinName: string | null
  nextOfKinPhone: string | null
  passportPhotoUrl: string | null
  totalCaptures: number
  hotLeads: number
  daysActive: number
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-5 border-b border-line last:border-0">
      <span className="text-sm text-muted flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{value}</span>
    </div>
  )
}

function EditableRow({
  label, value, displayValue, editing, type = 'text', inputMode, placeholder, onChange,
}: {
  label: string; value: string; displayValue: React.ReactNode; editing: boolean
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string; onChange: (v: string) => void
}) {
  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 py-3.5 px-5 border-b border-line last:border-0">
        <span className="text-sm text-muted flex-shrink-0">{label}</span>
        <span className={`text-sm font-medium text-right ${value ? 'text-ink' : 'text-muted'}`}>{displayValue}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-5 border-b border-line last:border-0">
      <span className="text-sm text-muted flex-shrink-0">{label}</span>
      <input
        type={type} inputMode={inputMode} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm text-right bg-cream border border-line rounded-xl px-3 py-2 outline-none focus:border-forest transition-colors min-w-0 text-ink"
      />
    </div>
  )
}

function StatCol({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 flex flex-col items-center py-4 gap-0.5">
      <span className="text-2xl font-bold text-ink">{value}</span>
      <span className="text-[10px] font-semibold tracking-widest text-muted uppercase">{label}</span>
    </div>
  )
}

export function AdminProfileView({
  userId, fullName, employeeId, role, phone,
  email, dateOfBirth, homeAddress, nextOfKinName, nextOfKinPhone,
  passportPhotoUrl, totalCaptures, hotLeads, daysActive,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [saved, setSaved] = useState({ email, dateOfBirth, homeAddress, nextOfKinName, nextOfKinPhone })
  const [draft, setDraft] = useState<Draft>({
    email: email ?? '', dateOfBirth: dateOfBirth ?? '',
    homeAddress: homeAddress ?? '', nextOfKinName: nextOfKinName ?? '',
    nextOfKinPhone: nextOfKinPhone ?? '',
  })

  function startEdit() {
    setDraft({
      email: saved.email ?? '', dateOfBirth: saved.dateOfBirth ?? '',
      homeAddress: saved.homeAddress ?? '', nextOfKinName: saved.nextOfKinName ?? '',
      nextOfKinPhone: saved.nextOfKinPhone ?? '',
    })
    setError(''); setEditing(true)
  }

  function set(field: keyof Draft) {
    return (v: string) => setDraft(d => ({ ...d, [field]: v }))
  }

  async function saveEdit() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: draft.email || null, dateOfBirth: draft.dateOfBirth || null,
          homeAddress: draft.homeAddress || null, nextOfKinName: draft.nextOfKinName || null,
          nextOfKinPhone: draft.nextOfKinPhone || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setSaved({
        email: draft.email || null, dateOfBirth: draft.dateOfBirth || null,
        homeAddress: draft.homeAddress || null, nextOfKinName: draft.nextOfKinName || null,
        nextOfKinPhone: draft.nextOfKinPhone || null,
      })
      setEditing(false)
    } catch { setError('Network error. Please try again.')
    } finally { setSaving(false) }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">

      {/* Back / Edit row */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Link>
        {editing ? (
          <div className="flex items-center gap-4">
            <button onClick={() => { setEditing(false); setError('') }} className="text-sm font-semibold text-muted hover:text-ink transition-colors">
              Cancel
            </button>
            <button onClick={saveEdit} disabled={saving} className="text-sm font-bold transition-colors disabled:opacity-50" style={{ color: '#2D5A27' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button onClick={startEdit} className="text-sm font-semibold transition-colors" style={{ color: '#2D5A27' }}>
            Edit
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600 font-medium text-center">{error}</p>}

      {/* Profile card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-line">

        {/* Banner */}
        <div className="relative h-32 flex items-center justify-center overflow-hidden bg-white border-b border-line">
          <img src="/banner.png" alt="" className="h-20 w-auto object-contain" />
        </div>

        {/* Avatar overlapping banner */}
        <div className="flex justify-center -mt-14 relative z-10 mb-3">
          <PhotoUpload userId={userId} initialPath={passportPhotoUrl} fullName={fullName} />
        </div>

        {/* Name + role */}
        <div className="text-center px-6 pb-4">
          <h1 className="text-xl font-bold text-ink">{fullName}</h1>
          <p className="text-sm text-muted mt-0.5">{ROLE_LABELS[role] ?? role} · {employeeId}</p>
        </div>

        {/* Stats */}
        <div className="flex divide-x divide-line border-t border-line">
          <StatCol label="Captures"   value={totalCaptures} />
          <StatCol label="Hot leads"  value={hotLeads} />
          <StatCol label="Days active" value={daysActive} />
        </div>

        {/* Info */}
        <div className="border-t border-line">
          <p className="text-[10px] font-bold tracking-widest text-muted uppercase px-5 pt-4 pb-2">Personal</p>
          <InfoRow label="Phone" value={formatPhone(phone)} />
          <EditableRow label="Email" value={draft.email}
            displayValue={saved.email ?? <span className="text-muted">Not set</span>}
            editing={editing} type="email" placeholder="your@email.com" onChange={set('email')} />
          <EditableRow label="Date of birth" value={draft.dateOfBirth}
            displayValue={saved.dateOfBirth ? formatDate(saved.dateOfBirth) : <span className="text-muted">Not set</span>}
            editing={editing} type="date" onChange={set('dateOfBirth')} />
          <EditableRow label="Home address" value={draft.homeAddress}
            displayValue={saved.homeAddress ?? <span className="text-muted">Not set</span>}
            editing={editing} placeholder="123 Main St, Abuja" onChange={set('homeAddress')} />
        </div>

        {saved.nextOfKinName || saved.nextOfKinPhone || editing ? (
          <div className="border-t border-line">
            <p className="text-[10px] font-bold tracking-widest text-muted uppercase px-5 pt-4 pb-2">Emergency contact</p>
            <EditableRow label="Next of kin" value={draft.nextOfKinName}
              displayValue={saved.nextOfKinName ?? <span className="text-muted">Not set</span>}
              editing={editing} placeholder="Full name" onChange={set('nextOfKinName')} />
            <EditableRow label="NoK phone" value={draft.nextOfKinPhone}
              displayValue={saved.nextOfKinPhone ? formatPhone(saved.nextOfKinPhone) : <span className="text-muted">Not set</span>}
              editing={editing} inputMode="tel" placeholder="08012345678" onChange={set('nextOfKinPhone')} />
          </div>
        ) : null}

        {/* Sign out */}
        <div className="border-t border-line py-5 flex justify-center">
          <button onClick={signOut} className="text-sm font-semibold" style={{ color: '#2D5A27' }}>
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}
