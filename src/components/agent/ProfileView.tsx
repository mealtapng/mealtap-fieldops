'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PhotoUpload } from '@/components/agent/PhotoUpload'
import { SignOutButton } from '@/app/(agent)/profile/sign-out-button'
import { BottomNav } from '@/components/agent/BottomNav'
import { formatPhone, formatDate, formatNaira } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileProps {
  userId: string
  fullName: string
  employeeId: string
  role: string
  phone: string
  email: string | null
  dateOfBirth: string | null
  homeAddress: string | null
  ninLast4: string | null
  nextOfKinName: string | null
  nextOfKinPhone: string | null
  bankName: string | null
  bankAccountMasked: string | null
  passportPhotoUrl: string | null
  qualityScore: number | null
  zoneName: string | null
  totalCaptures: number
  hotLeads: number
  daysActive: number
  hotLeadBonus: number
}

interface DraftState {
  email: string
  dateOfBirth: string
  homeAddress: string
  ninLast4: string
  nextOfKinName: string
  nextOfKinPhone: string
  bankName: string
  bankAccountMasked: string
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-5 border-b border-line last:border-0">
      <span className="text-sm text-muted flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${valueClassName ?? 'text-ink'}`}>{value}</span>
    </div>
  )
}

// ── EditableRow ───────────────────────────────────────────────────────────────

function EditableRow({
  label, value, displayValue, editing, type = 'text', inputMode, maxLength, placeholder, onChange,
}: {
  label: string; value: string; displayValue: React.ReactNode; editing: boolean
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number; placeholder?: string; onChange: (v: string) => void
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
        type={type} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm text-right bg-cream border border-line rounded-xl px-3 py-2 outline-none focus:border-forest transition-colors min-w-0 text-ink"
      />
    </div>
  )
}

// ── StatCol ───────────────────────────────────────────────────────────────────

function StatCol({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 flex flex-col items-center py-4 gap-0.5">
      <span className="text-2xl font-bold text-ink">{value}</span>
      <span className="text-[10px] font-semibold tracking-widest text-muted uppercase">{label}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileView({
  userId, fullName, employeeId, role, phone,
  email, dateOfBirth, homeAddress, ninLast4,
  nextOfKinName, nextOfKinPhone, bankName, bankAccountMasked,
  passportPhotoUrl, zoneName,
  totalCaptures, hotLeads, daysActive, hotLeadBonus,
}: ProfileProps) {
  const roleLabel =
    role === 'field_lead' ? 'Field Lead' :
    role === 'admin'      ? 'Admin' :
                            'Field Agent'

  const lifetimeBonus = hotLeads * hotLeadBonus

  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  const [saved, setSaved] = useState({
    email, dateOfBirth, homeAddress, ninLast4,
    nextOfKinName, nextOfKinPhone, bankName, bankAccountMasked,
  })

  const [draft, setDraft] = useState<DraftState>({
    email:             email             ?? '',
    dateOfBirth:       dateOfBirth       ?? '',
    homeAddress:       homeAddress       ?? '',
    ninLast4:          ninLast4          ?? '',
    nextOfKinName:     nextOfKinName     ?? '',
    nextOfKinPhone:    nextOfKinPhone    ?? '',
    bankName:          bankName          ?? '',
    bankAccountMasked: bankAccountMasked ?? '',
  })

  function startEdit() {
    setDraft({
      email:             saved.email             ?? '',
      dateOfBirth:       saved.dateOfBirth       ?? '',
      homeAddress:       saved.homeAddress       ?? '',
      ninLast4:          saved.ninLast4          ?? '',
      nextOfKinName:     saved.nextOfKinName     ?? '',
      nextOfKinPhone:    saved.nextOfKinPhone    ?? '',
      bankName:          saved.bankName          ?? '',
      bankAccountMasked: saved.bankAccountMasked ?? '',
    })
    setSaveError(''); setEditing(true)
  }

  function set(field: keyof DraftState) {
    return (v: string) => setDraft(d => ({ ...d, [field]: v }))
  }

  async function saveEdit() {
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:             draft.email             || null,
          dateOfBirth:       draft.dateOfBirth       || null,
          homeAddress:       draft.homeAddress       || null,
          ninLast4:          draft.ninLast4          || null,
          nextOfKinName:     draft.nextOfKinName     || null,
          nextOfKinPhone:    draft.nextOfKinPhone    || null,
          bankName:          draft.bankName          || null,
          bankAccountMasked: draft.bankAccountMasked || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Failed to save'); return }
      setSaved({
        email:             draft.email             || null,
        dateOfBirth:       draft.dateOfBirth       || null,
        homeAddress:       draft.homeAddress       || null,
        ninLast4:          draft.ninLast4          || null,
        nextOfKinName:     draft.nextOfKinName     || null,
        nextOfKinPhone:    draft.nextOfKinPhone    || null,
        bankName:          draft.bankName          || null,
        bankAccountMasked: draft.bankAccountMasked || null,
      })
      setEditing(false)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-md mx-auto">

        {/* Back / Edit row */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          {editing ? (
            <button onClick={() => { setEditing(false); setSaveError('') }}
              className="text-sm font-semibold text-muted hover:text-ink transition-colors">
              Cancel
            </button>
          ) : (
            <Link href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </Link>
          )}
          {editing ? (
            <button onClick={saveEdit} disabled={saving}
              className="text-sm font-bold transition-colors disabled:opacity-50" style={{ color: '#2D5A27' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <button onClick={startEdit}
              className="text-sm font-semibold transition-colors" style={{ color: '#2D5A27' }}>
              Edit
            </button>
          )}
        </div>

        {saveError && <p className="mb-3 text-sm text-red-600 font-medium text-center px-5">{saveError}</p>}

        {/* Profile card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-line mx-4">

          {/* Banner */}
          <div className="relative h-32 flex items-center justify-center overflow-hidden bg-white border-b border-line">
            <img src="/banner.png" alt="" className="h-20 w-auto object-contain" />
          </div>

          {/* Avatar overlapping banner */}
          <div className="flex justify-center -mt-14 relative z-10 mb-3">
            <PhotoUpload userId={userId} initialPath={passportPhotoUrl} fullName={fullName} />
          </div>

          {/* Name + role */}
          <div className="text-center px-6 pb-2">
            <h1 className="text-xl font-bold text-ink">{fullName}</h1>
            <p className="text-sm text-muted mt-0.5">{roleLabel} · {employeeId}</p>
            {zoneName && (
              <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-forest-light text-forest text-xs font-semibold">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {zoneName}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex divide-x divide-line border-t border-line mt-3">
            <StatCol label="Captures"    value={totalCaptures} />
            <StatCol label="Hot leads"   value={hotLeads} />
            <StatCol label="Days active" value={daysActive} />
          </div>

          {/* Personal */}
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

          {/* Verification & safety */}
          <div className="border-t border-line">
            <p className="text-[10px] font-bold tracking-widest text-muted uppercase px-5 pt-4 pb-2">Verification & safety</p>
            <EditableRow label="NIN (last 4)" value={draft.ninLast4}
              displayValue={saved.ninLast4
                ? <span>•••• •••• {saved.ninLast4} <span className="text-green-600">✓</span></span>
                : <span className="text-muted">Not set</span>}
              editing={editing} inputMode="numeric" maxLength={4} placeholder="1234"
              onChange={v => set('ninLast4')(v.replace(/\D/g, '').slice(0, 4))} />
            <EditableRow label="Next of kin" value={draft.nextOfKinName}
              displayValue={saved.nextOfKinName ?? <span className="text-muted">Not set</span>}
              editing={editing} placeholder="Full name" onChange={set('nextOfKinName')} />
            <EditableRow label="NoK phone" value={draft.nextOfKinPhone}
              displayValue={saved.nextOfKinPhone ? formatPhone(saved.nextOfKinPhone) : <span className="text-muted">Not set</span>}
              editing={editing} inputMode="tel" placeholder="08012345678" onChange={set('nextOfKinPhone')} />
          </div>

          {/* Payouts */}
          <div className="border-t border-line">
            <p className="text-[10px] font-bold tracking-widest text-muted uppercase px-5 pt-4 pb-2">Payouts</p>
            <EditableRow label="Bank" value={draft.bankName}
              displayValue={saved.bankName ?? <span className="text-muted">Not set</span>}
              editing={editing} placeholder="e.g. Access Bank" onChange={set('bankName')} />
            <EditableRow label="Account" value={draft.bankAccountMasked}
              displayValue={saved.bankAccountMasked ?? <span className="text-muted">Not set</span>}
              editing={editing} inputMode="numeric" placeholder="0123456789" onChange={set('bankAccountMasked')} />
            <InfoRow label="Hot lead bonus" value={formatNaira(lifetimeBonus)} valueClassName="text-terra font-bold" />
            <InfoRow label="Weekly salary" value="₦40,000 (paid separately)" valueClassName="text-muted" />
            <InfoRow label="Rate" value={`₦${hotLeadBonus.toLocaleString()} per hot lead`} valueClassName="text-muted" />
          </div>

          {/* Sign out */}
          <div className="border-t border-line py-5 flex justify-center">
            <SignOutButton />
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
