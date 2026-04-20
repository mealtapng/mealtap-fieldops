'use client'

import { useState } from 'react'
import type { Step4Data } from '@/lib/capture-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step4Data | null
  submitting:  boolean
  submitError: string | null
  onSubmit:    (data: Step4Data) => void
}

// ── Reaction config ───────────────────────────────────────────────────────────

const REACTIONS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Cold'       },
  { value: 2, emoji: '😐', label: 'Skeptical'  },
  { value: 3, emoji: '🙂', label: 'Open'        },
  { value: 4, emoji: '😊', label: 'Interested' },
  { value: 5, emoji: '🤩', label: 'Very keen'  },
]

// ── Tag config ────────────────────────────────────────────────────────────────

const TAGS: {
  value: Step4Data['tag']
  label: string
  activeClass: string
}[] = [
  { value: 'hot',       label: '🔥 Hot',       activeClass: 'bg-terra text-white border-terra'        },
  { value: 'warm',      label: '☀️ Warm',      activeClass: 'bg-amber-400 text-white border-amber-400' },
  { value: 'cold',      label: '❄️ Cold',      activeClass: 'bg-ink text-white border-ink'             },
  { value: 'not_a_fit', label: '✕ Not a fit',  activeClass: 'bg-red-500 text-white border-red-500'     },
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

export function CaptureStep4Qualification({
  initialData: initial,
  submitting,
  submitError,
  onSubmit,
}: Props) {
  const [reaction, setReaction] = useState<number | null>(initial?.ownerReaction ?? null)
  const [tag,      setTag]      = useState<Step4Data['tag']>(initial?.tag ?? null)
  const [notes,    setNotes]    = useState(initial?.notes ?? '')
  const [touched,  setTouched]  = useState(false)

  const canSubmit = reaction !== null && tag !== null

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
            <p className="text-xs text-muted-brand mb-3">
              How receptive was the owner to joining Mealtap?
            </p>
            <div className="flex gap-2">
              {REACTIONS.map(r => {
                const active = reaction === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReaction(r.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all
                      ${active
                        ? 'border-terra bg-terra-light scale-105'
                        : 'border-line bg-cream'
                      }`}
                  >
                    <span className="text-2xl leading-none">{r.emoji}</span>
                    <span className={`text-[9px] font-semibold leading-tight text-center ${active ? 'text-terra' : 'text-muted-brand'}`}>
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {touched && reaction === null && (
              <p className="text-[11px] text-red-500 mt-2">Select an owner reaction</p>
            )}
          </div>
        </div>

        {/* Lead tag */}
        <div>
          <SectionHeader title="Lead quality" />
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-xs text-muted-brand mb-3">
              How would you classify this lead?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TAGS.map(t => {
                const active = tag === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTag(t.value)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all
                      ${active
                        ? t.activeClass
                        : 'bg-cream border-line text-muted-brand'
                      }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
            {touched && tag === null && (
              <p className="text-[11px] text-red-500 mt-2">Select a lead tag</p>
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
              placeholder="Anything noteworthy about this restaurant or owner…"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/60
                focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra
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
              ? 'bg-terra/70 text-white cursor-not-allowed'
              : canSubmit
                ? 'bg-terra text-white shadow-lg shadow-terra/25 active:bg-terra-dark'
                : 'bg-line text-muted-brand cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving capture…
            </>
          ) : (
            'Submit capture →'
          )}
        </button>
        {touched && !canSubmit && !submitting && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Reaction and lead tag are required
          </p>
        )}
      </div>

    </div>
  )
}
