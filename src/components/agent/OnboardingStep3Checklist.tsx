'use client'

import { useState } from 'react'
import type { Step3Data } from '@/lib/onboarding-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step3Data | null
  onContinue:  (data: Step3Data) => void
}

// ── Checklist item config ─────────────────────────────────────────────────────

const CHECKLIST_ITEMS: {
  key: keyof Omit<Step3Data, 'tokenAmountPurchased'>
  label: string
  description: string
  icon: string
}[] = [
  {
    key:         'checklistSavedNumber',
    label:       'Saved the PowerChat number',
    description: 'Customer saved 0818-111-2220 in their contacts',
    icon:        '📱',
  },
  {
    key:         'checklistSentHi',
    label:       'Sent "Hi" on WhatsApp',
    description: 'Customer sent first message to PowerChat WhatsApp',
    icon:        '💬',
  },
  {
    key:         'checklistEnteredCode',
    label:       'Entered referral code',
    description: 'Customer typed your referral code when prompted',
    icon:        '🔑',
  },
  {
    key:         'checklistPurchasedToken',
    label:       'Purchased token of ₦1,000+',
    description: 'Customer completed their first electricity token purchase',
    icon:        '⚡',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export function OnboardingStep3Checklist({ initialData: initial, onContinue }: Props) {
  const [checklistSavedNumber,    setSavedNumber]    = useState(initial?.checklistSavedNumber    ?? false)
  const [checklistSentHi,         setSentHi]         = useState(initial?.checklistSentHi         ?? false)
  const [checklistEnteredCode,    setEnteredCode]    = useState(initial?.checklistEnteredCode    ?? false)
  const [checklistPurchasedToken, setPurchasedToken] = useState(initial?.checklistPurchasedToken ?? false)
  const [tokenAmount,             setTokenAmount]    = useState<string>(
    initial?.tokenAmountPurchased != null ? String(initial.tokenAmountPurchased) : ''
  )

  const values: Record<keyof Omit<Step3Data, 'tokenAmountPurchased'>, boolean> = {
    checklistSavedNumber,
    checklistSentHi,
    checklistEnteredCode,
    checklistPurchasedToken,
  }

  const setters: Record<keyof Omit<Step3Data, 'tokenAmountPurchased'>, (v: boolean) => void> = {
    checklistSavedNumber:    setSavedNumber,
    checklistSentHi:         setSentHi,
    checklistEnteredCode:    setEnteredCode,
    checklistPurchasedToken: setPurchasedToken,
  }

  const allChecked = checklistSavedNumber && checklistSentHi && checklistEnteredCode && checklistPurchasedToken
  const checkedCount = [checklistSavedNumber, checklistSentHi, checklistEnteredCode, checklistPurchasedToken].filter(Boolean).length

  function handleContinue() {
    onContinue({
      checklistSavedNumber,
      checklistSentHi,
      checklistEnteredCode,
      checklistPurchasedToken,
      tokenAmountPurchased: allChecked && tokenAmount !== '' ? Number(tokenAmount) : null,
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-3 pb-4">

        {/* WhatsApp number prominent display */}
        <div className="bg-success/10 rounded-2xl px-4 py-4 text-center">
          <p className="text-[10px] font-bold tracking-widest text-success uppercase mb-1">
            PowerChat WhatsApp Number
          </p>
          <p className="text-2xl font-bold text-success tracking-wide">
            0818-111-2220
          </p>
          <p className="text-[11px] text-success/70 mt-1">
            Show this to the customer
          </p>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map(item => {
            const checked = values[item.key]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setters[item.key](!checked)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                  checked
                    ? 'bg-success/10 border-success shadow-sm'
                    : 'bg-white border-line'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked
                    ? 'bg-success border-success'
                    : 'border-line bg-white'
                }`}>
                  {checked && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* Icon + text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{item.icon}</span>
                    <p className={`text-sm font-bold leading-snug ${checked ? 'text-success' : 'text-ink'}`}>
                      {item.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-brand mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Token amount input — only shown when all 4 checked */}
        {allChecked && (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2">
              Token amount purchased
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-brand overflow-hidden focus-within:ring-2 focus-within:ring-brand/30">
              <span className="px-3 py-2.5 text-sm font-bold text-brand bg-brand/10 border-r border-brand/30 flex-shrink-0">₦</span>
              <input
                type="number"
                inputMode="numeric"
                value={tokenAmount}
                onChange={e => setTokenAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="1000"
                min={1000}
                className="flex-1 px-3 py-2.5 text-sm text-ink placeholder:text-muted-brand/60 focus:outline-none bg-white"
              />
            </div>
            <p className="text-[11px] text-muted-brand mt-1">Minimum ₦1,000 — enter the exact amount</p>
          </div>
        )}

        {/* Progress summary */}
        <div className="bg-cream rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-brand font-medium">Steps completed</span>
          <span className={`text-sm font-bold ${allChecked ? 'text-success' : 'text-ink'}`}>
            {checkedCount} / 4 {allChecked ? '✓' : ''}
          </span>
        </div>

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            allChecked
              ? 'bg-success text-white shadow-lg shadow-success/25 active:bg-success-dark'
              : 'bg-brand text-white shadow-lg shadow-brand/25 active:bg-brand-dark'
          }`}
        >
          {allChecked ? '✓ Converted — continue →' : `Continue with ${checkedCount}/4 checked →`}
        </button>
      </div>

    </div>
  )
}
