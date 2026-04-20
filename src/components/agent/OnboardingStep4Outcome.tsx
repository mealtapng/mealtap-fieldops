'use client'

import { useState } from 'react'
import type { Step4Data } from '@/lib/onboarding-state'
import type { ConversionStatus } from '@/lib/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step4Data | null
  submitting:  boolean
  submitError: string | null
  onSubmit:    (data: Step4Data) => void
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES: {
  value: ConversionStatus
  label: string
  activeClass: string
  description: string
}[] = [
  {
    value:       'converted',
    label:       '✅ Converted',
    activeClass: 'bg-success text-white border-success',
    description: 'All 4 steps completed, token purchased',
  },
  {
    value:       'pending',
    label:       '⏳ Pending',
    activeClass: 'bg-amber-400 text-white border-amber-400',
    description: 'Started but not yet completed',
  },
  {
    value:       'failed',
    label:       '✕ Not interested',
    activeClass: 'bg-ink text-white border-ink',
    description: 'Customer declined to proceed',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2 px-1">
      {title}
    </p>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnboardingStep4Outcome({
  initialData: initial,
  submitting,
  submitError,
  onSubmit,
}: Props) {
  const [status,  setStatus]  = useState<ConversionStatus | null>(initial?.conversionStatus ?? null)
  const [notes,   setNotes]   = useState(initial?.notes ?? '')
  const [touched, setTouched] = useState(false)

  const canSubmit = status !== null

  function handleSubmit() {
    setTouched(true)
    if (!canSubmit || submitting) return
    onSubmit({ conversionStatus: status, notes })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-4 pb-4">

        {/* Conversion status */}
        <div>
          <SectionHeader title="Conversion outcome" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-xs text-muted-brand mb-3">
              What was the result of this onboarding?
            </p>
            <div className="space-y-2">
              {STATUSES.map(s => {
                const active = status === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`w-full flex items-start gap-3 py-3 px-4 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
                      active
                        ? s.activeClass
                        : 'bg-cream border-line text-muted-brand'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${active ? '' : 'text-ink'}`}>{s.label}</p>
                      <p className={`text-[11px] mt-0.5 ${active ? 'opacity-80' : 'text-muted-brand'}`}>
                        {s.description}
                      </p>
                    </div>
                    {active && (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            {touched && status === null && (
              <p className="text-[11px] text-red-500 mt-2">Select a conversion outcome</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <SectionHeader title="Notes" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5">
            <label className="block text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-1.5">
              Agent notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Any notes about this customer or their setup…"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/60
                focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                resize-none transition-colors"
            />
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">Submission failed</p>
            <p className="text-xs text-red-500 mt-0.5">{submitError}</p>
          </div>
        )}

      </div>

      {/* ── Sticky Submit button ──────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
            submitting
              ? 'bg-brand/70 text-white cursor-not-allowed'
              : canSubmit
                ? 'bg-brand text-white shadow-lg shadow-brand/25 active:bg-brand-dark'
                : 'bg-line text-muted-brand cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving onboarding…
            </>
          ) : (
            'Submit onboarding →'
          )}
        </button>
        {touched && !canSubmit && !submitting && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Conversion outcome is required
          </p>
        )}
      </div>

    </div>
  )
}
