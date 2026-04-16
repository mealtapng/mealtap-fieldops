'use client'

import Link from 'next/link'
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

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
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

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileView({
  userId,
  fullName,
  employeeId,
  role,
  phone,
  email,
  dateOfBirth,
  homeAddress,
  ninLast4,
  nextOfKinName,
  nextOfKinPhone,
  bankName,
  bankAccountMasked,
  passportPhotoUrl,
  qualityScore,
  zoneName,
  totalCaptures,
  hotLeads,
  daysActive,
}: ProfileProps) {
  const roleLabel =
    role === 'field_lead' ? 'Field Lead' :
    role === 'admin'      ? 'Admin' :
                            'Field Agent'

  const lifetimeEarnings = totalCaptures * 400 + hotLeads * 1_000

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-forest-dark rounded-b-[2.5rem] h-44 px-5 pt-12 flex-shrink-0 relative">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </Link>
            <button
              type="button"
              onClick={() => alert('Coming soon')}
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 pb-28">

          {/* ── Profile card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg mx-4 -mt-14 px-6 pt-6 pb-5">

            {/* Avatar */}
            <div className="flex justify-center">
              <PhotoUpload
                userId={userId}
                initialPath={passportPhotoUrl}
                fullName={fullName}
              />
            </div>

            {/* Name */}
            <h1 className="text-xl font-bold text-ink mt-3 text-center leading-tight">
              {fullName}
            </h1>

            {/* Role + employee ID */}
            <p className="text-xs text-muted-brand text-center mt-0.5">
              {roleLabel} · {employeeId}
            </p>

            {/* Badges */}
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {zoneName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-forest-light text-forest text-xs font-semibold">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {zoneName}
                </span>
              )}
              {(qualityScore ?? 0) >= 90 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-terra-light text-terra text-xs font-semibold">
                  ⭐ Top performer
                </span>
              )}
            </div>
          </div>

          {/* ── Lifetime stats bar ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm mx-4 mt-3 flex divide-x divide-line">
            <StatCol label="Captures"   value={totalCaptures} />
            <StatCol label="Hot leads"  value={hotLeads} />
            <StatCol label="Days active" value={daysActive} />
          </div>

          {/* ── Info sections ───────────────────────────────────────────────── */}
          <div className="px-4 mt-4 space-y-4">

            <Section title="Personal">
              <InfoRow label="Phone"         value={formatPhone(phone)} />
              <InfoRow
                label="Email"
                value={email ?? 'Not set'}
                valueClassName={email ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="Date of birth"
                value={dateOfBirth ? formatDate(dateOfBirth) : 'Not set'}
                valueClassName={dateOfBirth ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="Home address"
                value={homeAddress ?? 'Not set'}
                valueClassName={homeAddress ? 'text-ink' : 'text-muted-brand'}
              />
            </Section>

            <Section title="Verification & safety">
              <InfoRow
                label="NIN"
                value={
                  ninLast4
                    ? <span>•••• •••• {ninLast4} <span className="text-terra">✓</span></span>
                    : 'Not set'
                }
                valueClassName={ninLast4 ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="Next of kin"
                value={nextOfKinName ?? 'Not set'}
                valueClassName={nextOfKinName ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="NoK phone"
                value={nextOfKinPhone ? formatPhone(nextOfKinPhone) : 'Not set'}
                valueClassName={nextOfKinPhone ? 'text-ink' : 'text-muted-brand'}
              />
            </Section>

            <Section title="Payouts">
              <InfoRow
                label="Bank"
                value={bankName ?? 'Not set'}
                valueClassName={bankName ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="Account"
                value={bankAccountMasked ?? 'Not set'}
                valueClassName={bankAccountMasked ? 'text-ink' : 'text-muted-brand'}
              />
              <InfoRow
                label="Lifetime earnings"
                value={formatNaira(lifetimeEarnings)}
                valueClassName="text-forest font-bold"
              />
            </Section>

            {/* Sign out */}
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
