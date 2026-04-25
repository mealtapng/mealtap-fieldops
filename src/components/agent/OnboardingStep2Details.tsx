'use client'

import { useState } from 'react'
import { DISCO_OPTIONS } from '@/lib/onboarding-state'
import type { Step2Data } from '@/lib/onboarding-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData:  Step2Data | null
  referralCode: string
  onContinue:   (data: Step2Data) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-muted uppercase mb-2 px-1">
      {title}
    </p>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
      {children}
    </div>
  )
}

interface TextInputProps {
  label:       string
  value:       string
  onChange:    (v: string) => void
  type?:       string
  inputMode?:  React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  hint?:       string
  required?:   boolean
  touched?:    boolean
  maxLength?:  number
}

function TextInput({
  label, value, onChange, type = 'text', inputMode, placeholder, hint, required, touched, maxLength,
}: TextInputProps) {
  const invalid = required && touched && value.trim().length === 0
  return (
    <div className="px-4 py-3.5">
      <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
        {label}{required && <span className="text-brand ml-0.5">*</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60
          focus:outline-none focus:ring-2 focus:border-forest transition-colors
          ${invalid
            ? 'border-red-400 focus:ring-red-200'
            : 'border-line focus:ring-forest/30'
          }`}
      />
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
      {invalid && <p className="text-[11px] text-red-500 mt-1">This field is required</p>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnboardingStep2Details({ initialData: initial, referralCode, onContinue }: Props) {
  const [userPhone,    setUserPhone]   = useState(initial?.userPhone   ?? '')
  const [userName,     setUserName]    = useState(initial?.userName    ?? '')
  const [meterNumber,  setMeterNumber] = useState(initial?.meterNumber ?? '')
  const [discoArea,    setDiscoArea]   = useState(initial?.discoArea   ?? '')

  const [phoneTouched, setPhoneTouched] = useState(false)
  const [nameTouched,  setNameTouched]  = useState(false)
  const [discoTouched, setDiscoTouched] = useState(false)

  const canContinue =
    userPhone.trim().length >= 10 &&
    userName.trim().length > 0 &&
    discoArea.length > 0

  function handleContinue() {
    setPhoneTouched(true)
    setNameTouched(true)
    setDiscoTouched(true)
    if (!canContinue) return
    onContinue({
      userPhone:   userPhone.trim(),
      userName:    userName.trim(),
      meterNumber: meterNumber.trim(),
      discoArea,
    })
  }

  const phoneInvalid = phoneTouched && userPhone.trim().length < 10
  const discoInvalid = discoTouched && discoArea.length === 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-4 pb-4">

        {/* Referral code display */}
        <div className="bg-forest/10 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">⚡</span>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
              Your referral code
            </p>
            <p className="text-lg font-bold text-brand tracking-wider mt-0.5">
              {referralCode || '—'}
            </p>
            <p className="text-[11px] text-brand/70 mt-0.5">
              Share this with the customer so they enter it on WhatsApp
            </p>
          </div>
        </div>

        {/* Customer */}
        <div>
          <SectionHeader title="Customer" />
          <FormCard>
            {/* Phone */}
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                Phone number<span className="text-brand ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-0 rounded-xl border overflow-hidden
                focus-within:ring-2 focus-within:ring-forest/30 focus-within:border-forest transition-colors
                border-line">
                <span className="px-3 py-2.5 text-sm font-semibold text-ink bg-cream border-r border-line flex-shrink-0">
                  🇳🇬 +234
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={userPhone}
                  onChange={e => { setUserPhone(e.target.value); setPhoneTouched(true) }}
                  placeholder="08XX XXX XXXX"
                  maxLength={15}
                  className="flex-1 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none bg-white"
                />
              </div>
              {phoneInvalid && (
                <p className="text-[11px] text-red-500 mt-1">Enter a valid Nigerian phone number</p>
              )}
            </div>

            <TextInput
              label="Full name"
              value={userName}
              onChange={v => { setUserName(v); setNameTouched(true) }}
              placeholder="Customer's full name"
              required
              touched={nameTouched}
            />
          </FormCard>
        </div>

        {/* Electricity details */}
        <div>
          <SectionHeader title="Electricity Details" />
          <FormCard>
            {/* DISCO dropdown */}
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                DISCO area<span className="text-brand ml-0.5">*</span>
              </label>
              <select
                value={discoArea}
                onChange={e => { setDiscoArea(e.target.value); setDiscoTouched(true) }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink bg-white
                  focus:outline-none focus:ring-2 focus:border-forest transition-colors appearance-none
                  ${discoInvalid
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-line focus:ring-forest/30'
                  }`}
              >
                <option value="">Select electricity provider…</option>
                {DISCO_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {discoInvalid && (
                <p className="text-[11px] text-red-500 mt-1">Please select a DISCO</p>
              )}
            </div>

            <TextInput
              label="Meter number"
              value={meterNumber}
              onChange={setMeterNumber}
              inputMode="numeric"
              placeholder="11–13 digit meter number"
              hint="Optional — written on the prepaid meter"
              maxLength={13}
            />
          </FormCard>
        </div>

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canContinue
              ? 'bg-brand text-white shadow-lg shadow-forest/25 active:bg-forest-dark'
              : 'bg-line text-muted cursor-not-allowed'
          }`}
        >
          Continue to checklist →
        </button>
        {!canContinue && (nameTouched || phoneTouched || discoTouched) && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Phone, name and DISCO are required
          </p>
        )}
      </div>
    </div>
  )
}
