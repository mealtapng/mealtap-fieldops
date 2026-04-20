'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { CaptureStep4Qualification } from '@/components/agent/CaptureStep4Qualification'

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
  const router = useRouter()
  const [step, setStep]               = useState(1)
  const [captureData, setCaptureData] = useState<CaptureWizardState>(EMPTY_CAPTURE_STATE)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  async function handleSubmit(step4: Step4Data) {
    const { step1, step2, step3 } = captureData
    if (!step1 || !step2) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Upload photos client-side to Supabase Storage
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const timestamp = Date.now()
      const photoBase = `${user.id}/${timestamp}`
      const photos: { storefront: string | null; menu: string | null; dish: string | null } = {
        storefront: null,
        menu: null,
        dish: null,
      }

      const uploadPhoto = async (file: File, type: keyof typeof photos) => {
        const path = `${photoBase}/${type}.jpg`
        const { error } = await supabase.storage
          .from('restaurant-photos')
          .upload(path, file, { upsert: true, contentType: 'image/jpeg' })
        if (error) throw new Error(`Photo upload failed (${type}): ${error.message}`)
        photos[type] = path
      }

      const uploads: Promise<void>[] = []
      if (step3?.storefrontPhoto) uploads.push(uploadPhoto(step3.storefrontPhoto, 'storefront'))
      if (step3?.menuPhoto)       uploads.push(uploadPhoto(step3.menuPhoto,       'menu'))
      if (step3?.dishPhoto)       uploads.push(uploadPhoto(step3.dishPhoto,       'dish'))
      await Promise.all(uploads)

      // 2. Submit all text data + photo paths to server route
      const res = await fetch('/api/capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step1, step2, step4, photos }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Server error ${res.status}`)
      }

      // 3. Success — back to dashboard
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
                s < step  ? 'bg-forest' :
                s === step ? 'bg-terra'  :
                            'bg-line'
              }`}
            />
          ))}
        </div>

        {/* ── Step header ───────────────────────────────────────────────── */}
        <div className="flex items-center px-4 py-3 flex-shrink-0">
          {/* Back button — disabled while submitting */}
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
              onClick={() => { if (!submitting) setStep(s => s - 1) }}
              disabled={submitting}
              className="flex items-center gap-1 text-sm font-semibold text-muted-brand hover:text-ink transition-colors disabled:opacity-40"
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
            <CaptureStep4Qualification
              initialData={captureData.step4}
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
