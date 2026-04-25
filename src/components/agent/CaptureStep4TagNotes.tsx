'use client'

import { useState } from 'react'
import type { Step4Data } from '@/lib/capture-state'
import type { LeadTag } from '@/lib/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step4Data | null
  submitting:  boolean
  submitError: string | null
  onSubmit:    (data: Step4Data) => void
}

// ── Config ────────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['😠', '😕', '😐', '🙂', '😃']

const TAG_OPTIONS: {
  value:       LeadTag
  label:       string
  description: string
  activeClass: string
}[] = [
  {
    value:       'hot',
    label:       '🔥 Hot',
    description: 'Very interested, ready to onboard',
    activeClass: 'bg-terra text-white border-terra',
  },
  {
    value:       'warm',
    label:       '✅ Warm',
    description: 'Interested but needs follow-up',
    activeClass: 'bg-forest text-white border-forest',
  },
  {
    value:       'cold',
    label:       '❄️ Cold',
    description: 'Not interested right now',
    activeClass: 'bg-ink text-white border-ink',
  },
  {
    value:       'not_a_fit',
    label:       '✕ Not a fit',
    description: 'Restaurant not suitable for Mealtap',
    activeClass: 'bg-red-500 text-white border-red-500',
  },
]

const MAX_NOTES = 500

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-muted uppercase mb-2 px-1">
      {title}
    </p>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaptureStep4TagNotes({
  initialData: initial,
  submitting,
  submitError,
  onSubmit,
}: Props) {
  const [reaction, setReaction] = useState<number>(initial?.ownerReaction ?? 3)
  const [tag,      setTag]      = useState<LeadTag | null>(initial?.tag ?? null)
  const [notes,    setNotes]    = useState(initial?.notes ?? '')
  const [touched,  setTouched]  = useState(false)

  const canSubmit = tag !== null

  function handleSubmit() {
    setTouched(true)
    if (!canSubmit || submitting) return
    onSubmit({ ownerReaction: reaction, tag, notes })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-4 pb-4">

        {/* Owner reaction */}
        <div>
          <SectionHeader title="Owner reaction" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-xs text-muted mb-4">
              How did the owner respond to the Mealtap pitch?
            </p>

            {/* Emoji display */}
            <div className="flex justify-center mb-4">
              <span className="text-5xl transition-all duration-150">
                {REACTION_EMOJIS[reaction - 1]}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={reaction}
              onChange={e => setReaction(Number(e.target.value))}
              className="w-full accent-terra"
            />

            {/* Scale labels */}
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted font-medium">Very negative</span>
              <span className="text-[10px] text-muted font-medium">Very positive</span>
            </div>
          </div>
        </div>

        {/* Lead tag */}
        <div>
          <SectionHeader title="Lead quality" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-xs text-muted mb-3">
              How likely is this restaurant to join Mealtap?
            </p>
            <div className="space-y-2">
              {TAG_OPTIONS.map(opt => {
                const active = tag === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTag(opt.value)}
                    className={`w-full flex items-start gap-3 py-3 px-4 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
                      active
                        ? opt.activeClass
                        : 'bg-cream border-line text-muted'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${active ? '' : 'text-ink'}`}>{opt.label}</p>
                      <p className={`text-[11px] mt-0.5 ${active ? 'opacity-80' : 'text-muted'}`}>
                        {opt.description}
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
            {touched && tag === null && (
              <p className="text-[11px] text-red-500 mt-2">Select a lead tag to continue</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <SectionHeader title="Notes" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5">
            <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
              Agent notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, MAX_NOTES))}
              rows={4}
              placeholder="Any notes about this restaurant or follow-up actions…"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                resize-none transition-colors"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[11px] ${notes.length >= MAX_NOTES ? 'text-terra' : 'text-muted'}`}>
                {notes.length}/{MAX_NOTES}
              </span>
            </div>
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
              ? 'bg-forest/70 text-white cursor-not-allowed'
              : canSubmit
                ? 'bg-terra text-white shadow-lg shadow-terra/25 active:bg-terra-dark'
                : 'bg-line text-muted cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving capture…
            </>
          ) : (
            '🍽️ Submit capture →'
          )}
        </button>
        {touched && !canSubmit && !submitting && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Select a lead tag before submitting
          </p>
        )}
      </div>

    </div>
  )
}
