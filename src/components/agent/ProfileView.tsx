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
  referralCode: string | null
  totalOnboardings: number
  conversions: number
  daysActive: number
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
    <div className="px-5 py-3.5 flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-muted-brand flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${valueClassName ?? 'text-ink'}`}>
        {value}
      </span>
    </div>
  )
}

// ── EditableRow ───────────────────────────────────────────────────────────────

function EditableRow({
  label,
  value,
  displayValue,
  editing,
  type = 'text',
  inputMode,
  maxLength,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  displayValue: React.ReactNode
  editing: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  placeholder?: string
  onChange: (v: string) => void
}) {
  if (!editing) {
    return (
      <div className="px-5 py-3.5 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-muted-brand flex-shrink-0">{label}</span>
        <span className={`text-sm font-medium text-right ${value ? 'text-ink' : 'text-muted-brand'}`}>
          {displayValue}
        </span>
      </div>
    )
  }
  return (
    <div className="px-5 py-2.5 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-muted-brand flex-shrink-0 w-28">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 text-sm text-right bg-cream border border-line rounded-xl px-3 py-2 outline-none focus:border-brand transition-colors min-w-0"
        style={{ color: '#1a2e1b' }}
      />
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest text-muted-brand uppercase mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
        {children}
      </div>
    </div>
  )
}

// ── StatCol ───────────────────────────────────────────────────────────────────

function StatCol({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 flex flex-col items-center py-4 gap-0.5">
      <span className="text-xl font-bold text-ink">{value}</span>
      <span className="text-[10px] font-semibold tracking-wider text-muted-brand uppercase">
        {label}
      </span>
    </div>
  )
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button type="button" onClick={handleCopy} className="text-xs font-semibold flex-shrink-0" style={{ color: '#1B5E20' }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileView({
  userId, fullName, employeeId, role, phone,
  email, dateOfBirth, homeAddress, ninLast4,
  nextOfKinName, nextOfKinPhone, bankName, bankAccountMasked,
  passportPhotoUrl, qualityScore, zoneName, referralCode,
  totalOnboardings, conversions, daysActive,
}: ProfileProps) {
  const roleLabel =
    role === 'field_lead' ? 'Field Lead' :
    role === 'admin'      ? 'Admin' :
                            'Field Agent'

  const lifetimeEarnings = conversions * 100

  // ── Edit state ──────────────────────────────────────────────────────────────

  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  // Current saved values (updated on successful save)
  const [saved, setSaved] = useState({
    email,
    dateOfBirth,
    homeAddress,
    ninLast4,
    nextOfKinName,
    nextOfKinPhone,
    bankName,
    bankAccountMasked,
  })

  // Draft while editing
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
    setSaveError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError('')
  }

  function set(field: keyof DraftState) {
    return (v: string) => setDraft(d => ({ ...d, [field]: v }))
  }

  async function saveEdit() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/profile/update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
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
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div
          className="rounded-b-[2.5rem] h-44 px-5 pt-12 flex-shrink-0 relative"
          style={{ background: 'linear-gradient(160deg, #0D1B0E 0%, #0a2e0c 100%)' }}
        >
          <div className="flex items-center justify-between">
            {editing ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back
              </Link>
            )}
            {editing ? (
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="text-sm font-bold transition-colors disabled:opacity-50"
                style={{ color: '#25D366' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 pb-28">

          {/* ── Profile card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg mx-4 -mt-14 px-6 pt-6 pb-5">
            <div className="flex justify-center">
              <PhotoUpload userId={userId} initialPath={passportPhotoUrl} fullName={fullName} />
            </div>
            <h1 className="text-xl font-bold text-ink mt-3 text-center leading-tight">{fullName}</h1>
            <p className="text-xs text-muted-brand text-center mt-0.5">{roleLabel} · {employeeId}</p>
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {zoneName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {zoneName}
                </span>
              )}
              {(qualityScore ?? 0) >= 90 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-success-light text-success text-xs font-semibold">
                  ⭐ Top performer
                </span>
              )}
            </div>
            {referralCode && (
              <div className="mt-4 bg-brand/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-brand uppercase">Your referral code</p>
                  <p className="text-lg font-bold text-brand tracking-wider mt-0.5">{referralCode}</p>
                </div>
                <CopyButton value={referralCode} />
              </div>
            )}
          </div>

          {/* ── Lifetime stats bar ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm mx-4 mt-3 flex divide-x divide-line">
            <StatCol label="Onboardings" value={totalOnboardings} />
            <StatCol label="Conversions"  value={conversions} />
            <StatCol label="Days active"  value={daysActive} />
          </div>

          {/* ── Save error ───────────────────────────────────────────────── */}
          {saveError && (
            <p className="mx-4 mt-3 text-center text-xs text-red-600 font-medium">{saveError}</p>
          )}

          {/* ── Info sections ─────────────────────────────────────────────── */}
          <div className="px-4 mt-4 space-y-4">

            <Section title="Personal">
              <InfoRow label="Phone" value={formatPhone(phone)} />
              <EditableRow
                label="Email"
                value={draft.email}
                displayValue={saved.email ?? <span className="text-muted-brand">Not set</span>}
                editing={editing}
                type="email"
                placeholder="your@email.com"
                onChange={set('email')}
              />
              <EditableRow
                label="Date of birth"
                value={draft.dateOfBirth}
                displayValue={saved.dateOfBirth ? formatDate(saved.dateOfBirth) : <span className="text-muted-brand">Not set</span>}
                editing={editing}
                type="date"
                onChange={set('dateOfBirth')}
              />
              <EditableRow
                label="Home address"
                value={draft.homeAddress}
                displayValue={saved.homeAddress ?? <span className="text-muted-brand">Not set</span>}
                editing={editing}
                placeholder="123 Main St, Abuja"
                onChange={set('homeAddress')}
              />
            </Section>

            <Section title="Verification & safety">
              <EditableRow
                label="NIN (last 4)"
                value={draft.ninLast4}
                displayValue={
                  saved.ninLast4
                    ? <span>•••• •••• {saved.ninLast4} <span className="text-success">✓</span></span>
                    : <span className="text-muted-brand">Not set</span>
                }
                editing={editing}
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                onChange={v => set('ninLast4')(v.replace(/\D/g, '').slice(0, 4))}
              />
              <EditableRow
                label="Next of kin"
                value={draft.nextOfKinName}
                displayValue={saved.nextOfKinName ?? <span className="text-muted-brand">Not set</span>}
                editing={editing}
                placeholder="Full name"
                onChange={set('nextOfKinName')}
              />
              <EditableRow
                label="NoK phone"
                value={draft.nextOfKinPhone}
                displayValue={saved.nextOfKinPhone ? formatPhone(saved.nextOfKinPhone) : <span className="text-muted-brand">Not set</span>}
                editing={editing}
                inputMode="tel"
                placeholder="08012345678"
                onChange={set('nextOfKinPhone')}
              />
            </Section>

            <Section title="Payouts">
              <EditableRow
                label="Bank"
                value={draft.bankName}
                displayValue={saved.bankName ?? <span className="text-muted-brand">Not set</span>}
                editing={editing}
                placeholder="e.g. Access Bank"
                onChange={set('bankName')}
              />
              <EditableRow
                label="Account"
                value={draft.bankAccountMasked}
                displayValue={saved.bankAccountMasked ?? <span className="text-muted-brand">Not set</span>}
                editing={editing}
                inputMode="numeric"
                placeholder="0123456789"
                onChange={set('bankAccountMasked')}
              />
              <InfoRow
                label="Lifetime earnings"
                value={formatNaira(lifetimeEarnings)}
                valueClassName="text-brand font-bold"
              />
              <InfoRow label="Rate" value="₦100 per conversion" valueClassName="text-muted-brand" />
            </Section>

            <div className="mt-6 mb-4 text-center">
              <SignOutButton />
            </div>

          </div>
        </div>

        <BottomNav />

      </div>
    </div>
  )
}
