'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
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
} from '@/lib/capture-state'
import { CaptureStep2Details } from '@/components/agent/CaptureStep2Details'
import { CaptureStep3Photos } from '@/components/agent/CaptureStep3Photos'

// Load GPS step without SSR — mapbox-gl uses browser APIs
const CaptureStep1GPS = dynamic(
  () => import('@/components/agent/CaptureStep1GPS').then(m => ({ default: m.CaptureStep1GPS })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-brand">Loading map…</p>
      </div>
    ),
  }
)

// ── Wizard page ───────────────────────────────────────────────────────────────

export default function CapturePage() {
  const [step, setStep]             = useState(1)
  const [captureData, setCaptureData] = useState<CaptureWizardState>(EMPTY_CAPTURE_STATE)

  function handleStep1Continue(data: Step1Data) {
    setCaptureData(prev => ({ ...prev, step1: data }))
    setStep(2)
  }

  function handleStep2Continue(data: Step2Data) {
    setCaptureData(prev => ({ ...prev, step2: data }))
    setStep(3)
  }

  function handleStep3Continue(data: Step3Data) {
    setCaptureData(prev => ({ ...prev, step3: data }))
    setStep(4)
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
                s < step  ? 'bg-forest' :
                s === step ? 'bg-terra'  :
                            'bg-line'
              }`}
            />
          ))}
        </div>

        {/* ── Step header ───────────────────────────────────────────────── */}
        <div className="flex items-center px-4 py-3 flex-shrink-0">
          {/* Back button */}
          {step === 1 ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm font-semibold text-muted-brand hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </Link>
          ) : (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 text-sm font-semibold text-muted-brand hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>
          )}

          {/* Step label + title */}
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold tracking-widest text-muted-brand uppercase">
              Step {step} of {TOTAL_STEPS}
            </p>
            <p className="text-sm font-bold text-ink leading-tight">
              {STEP_TITLES[step]}
            </p>
          </div>

          {/* Save draft */}
          <button
            onClick={() => console.log('save draft', captureData)}
            className="text-sm font-semibold text-terra"
          >
            Save draft
          </button>
        </div>

        {/* ── Step content ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden pb-[52px]">
          {step === 1 && (
            <CaptureStep1GPS
              initialData={captureData.step1}
              onContinue={handleStep1Continue}
            />
          )}
          {step === 2 && (
            <CaptureStep2Details
              initialData={captureData.step2}
              onContinue={handleStep2Continue}
            />
          )}
          {step === 3 && (
            <CaptureStep3Photos
              initialData={captureData.step3}
              onContinue={handleStep3Continue}
            />
          )}
          {step === 4 && (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <p className="text-2xl mb-2">🚧</p>
                <p className="text-sm font-semibold text-ink">
                  {STEP_TITLES[4]}
                </p>
                <p className="text-xs text-muted-brand mt-1">Coming in the next task</p>
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
