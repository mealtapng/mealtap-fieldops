'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BottomNav } from '@/components/agent/BottomNav'
import {
  EMPTY_CAPTURE_STATE,
  STEP_TITLES,
  TOTAL_STEPS,
  type CaptureWizardState,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
} from '@/lib/capture-state'
import { CaptureStep2Details } from '@/components/agent/CaptureStep2Details'
import { CaptureStep3Photos } from '@/components/agent/CaptureStep3Photos'
import { CaptureStep4TagNotes } from '@/components/agent/CaptureStep4TagNotes'

// Load GPS step without SSR — mapbox-gl uses browser APIs
const CaptureStep1GPS = dynamic(
  () => import('@/components/agent/CaptureStep1GPS').then(m => ({ default: m.CaptureStep1GPS })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted">Loading map…</p>
      </div>
    ),
  }
)

// ── Wizard page ───────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep]             = useState(1)
  const [wizardData, setWizardData] = useState<CaptureWizardState>(EMPTY_CAPTURE_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleStep1Continue(data: Step1Data) {
    setWizardData(prev => ({ ...prev, step1: data }))
    setStep(2)
  }

  function handleStep2Continue(data: Step2Data) {
    setWizardData(prev => ({ ...prev, step2: data }))
    setStep(3)
  }

  function handleStep3Continue(data: Step3Data) {
    setWizardData(prev => ({ ...prev, step3: data }))
    setStep(4)
  }

  async function handleSubmit(step4: Step4Data) {
    const { step1, step2, step3 } = wizardData
    if (!step1 || !step2) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/onboard/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step1, step2, step3, step4 }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Server error ${res.status}`)
      }

      router.push('/dashboard')

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        <div className="flex gap-1.5 px-4 pt-4 pb-1 flex-shrink-0">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                s < step   ? 'bg-terra'  :
                s === step ? 'bg-forest' :
                             'bg-line'
              }`}
            />
          ))}
        </div>

        {/* ── Step header ───────────────────────────────────────────────── */}
        <div className="flex items-center px-4 py-3 flex-shrink-0">
          {step === 1 ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </Link>
          ) : (
            <button
              onClick={() => { if (!submitting) setStep(s => s - 1) }}
              disabled={submitting}
              className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>
          )}

          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
              Step {step} of {TOTAL_STEPS}
            </p>
            <p className="text-sm font-bold text-ink leading-tight">
              {STEP_TITLES[step]}
            </p>
          </div>

          {/* Spacer to balance flex layout */}
          <div className="w-[60px]" />
        </div>

        {/* ── Step content ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden pb-[52px]">
          {step === 1 && (
            <CaptureStep1GPS
              initialData={wizardData.step1}
              onContinue={handleStep1Continue}
            />
          )}
          {step === 2 && (
            <CaptureStep2Details
              initialData={wizardData.step2}
              onContinue={handleStep2Continue}
            />
          )}
          {step === 3 && (
            <CaptureStep3Photos
              initialData={wizardData.step3}
              onContinue={handleStep3Continue}
            />
          )}
          {step === 4 && (
            <CaptureStep4TagNotes
              initialData={wizardData.step4}
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
