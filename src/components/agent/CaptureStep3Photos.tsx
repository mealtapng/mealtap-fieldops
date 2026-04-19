'use client'

import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import type { Step3Data } from '@/lib/capture-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step3Data | null
  onContinue: (data: Step3Data) => void
}

// ── Photo slot config ─────────────────────────────────────────────────────────

interface SlotConfig {
  key: keyof Step3Data
  label: string
  hint: string
  icon: React.ReactNode
}

const CAMERA_ICON = (
  <svg className="w-8 h-8 text-muted-brand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const SLOTS: SlotConfig[] = [
  {
    key:   'storefrontPhoto',
    label: 'Storefront',
    hint:  'Front of the restaurant — sign visible',
    icon:  CAMERA_ICON,
  },
  {
    key:   'menuPhoto',
    label: 'Menu / Price board',
    hint:  'Price list, whiteboard, or printed menu',
    icon:  CAMERA_ICON,
  },
  {
    key:   'dishPhoto',
    label: 'Signature dish',
    hint:  'Best-looking item on offer',
    icon:  CAMERA_ICON,
  },
]

// ── Compression settings ──────────────────────────────────────────────────────

const COMPRESS_OPTIONS = {
  maxSizeMB:        1,
  maxWidthOrHeight: 1280,
  useWebWorker:     true,
  fileType:         'image/jpeg',
} as const

// ── Photo slot component ──────────────────────────────────────────────────────

interface PhotoSlotProps {
  config:    SlotConfig
  file:      File | null
  preview:   string | null
  loading:   boolean
  onPick:    (key: keyof Step3Data, file: File) => void
  onRemove:  (key: keyof Step3Data) => void
}

function PhotoSlot({ config, file, preview, loading, onPick, onRemove }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onPick(config.key, f)
    // Reset so the same file can be re-picked
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div>
          <p className="text-sm font-bold text-ink">{config.label}</p>
          <p className="text-[11px] text-muted-brand mt-0.5">{config.hint}</p>
        </div>
        {file && (
          <button
            type="button"
            onClick={() => onRemove(config.key)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors flex-shrink-0"
            aria-label="Remove photo"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tap area */}
      <div
        className={`mx-4 mb-4 rounded-xl overflow-hidden transition-colors ${
          file
            ? 'border-0'
            : 'border-2 border-dashed border-line active:border-terra cursor-pointer'
        }`}
        style={{ height: file ? 180 : 120 }}
        onClick={() => !loading && inputRef.current?.click()}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-cream">
            <div className="w-6 h-6 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
            <p className="text-[11px] text-muted-brand">Compressing…</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={config.label}
              className="w-full h-full object-cover"
            />
            {/* Re-pick overlay on tap */}
            <div
              className="absolute inset-0 bg-black/0 active:bg-black/20 transition-colors flex items-center justify-center cursor-pointer"
              onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
            >
              <div className="opacity-0 active:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            {config.icon}
            <p className="text-[11px] text-muted-brand font-medium">Tap to add photo</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaptureStep3Photos({ initialData: initial, onContinue }: Props) {
  const [files, setFiles] = useState<Step3Data>({
    storefrontPhoto: initial?.storefrontPhoto ?? null,
    menuPhoto:       initial?.menuPhoto       ?? null,
    dishPhoto:       initial?.dishPhoto       ?? null,
  })

  // Object URLs for preview — created on File pick
  const [previews, setPreviews] = useState<Record<keyof Step3Data, string | null>>({
    storefrontPhoto: initial?.storefrontPhoto ? URL.createObjectURL(initial.storefrontPhoto) : null,
    menuPhoto:       initial?.menuPhoto       ? URL.createObjectURL(initial.menuPhoto)       : null,
    dishPhoto:       initial?.dishPhoto       ? URL.createObjectURL(initial.dishPhoto)       : null,
  })

  // Per-slot loading state (compression)
  const [loading, setLoading] = useState<Record<keyof Step3Data, boolean>>({
    storefrontPhoto: false,
    menuPhoto:       false,
    dishPhoto:       false,
  })

  async function handlePick(key: keyof Step3Data, raw: File) {
    // Show instant preview before compression
    const rawUrl = URL.createObjectURL(raw)
    setPreviews(p => ({ ...p, [key]: rawUrl }))
    setLoading(l => ({ ...l, [key]: true }))

    try {
      const compressed = await imageCompression(raw, COMPRESS_OPTIONS)
      // Revoke raw URL, set compressed File + preview
      URL.revokeObjectURL(rawUrl)
      const url = URL.createObjectURL(compressed)
      setFiles(f => ({ ...f, [key]: compressed }))
      setPreviews(p => ({ ...p, [key]: url }))
    } catch {
      // Keep raw file if compression fails
      setFiles(f => ({ ...f, [key]: raw }))
      setPreviews(p => ({ ...p, [key]: rawUrl }))
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  function handleRemove(key: keyof Step3Data) {
    const prev = previews[key]
    if (prev) URL.revokeObjectURL(prev)
    setFiles(f => ({ ...f, [key]: null }))
    setPreviews(p => ({ ...p, [key]: null }))
  }

  const anyLoading = Object.values(loading).some(Boolean)
  const photoCount = Object.values(files).filter(Boolean).length

  function handleContinue() {
    if (anyLoading) return
    onContinue(files)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-3 pb-4">

        {/* Info banner */}
        <div className="bg-terra-light rounded-xl px-4 py-3 flex gap-3 items-start">
          <svg className="w-4 h-4 text-terra flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[12px] text-terra leading-relaxed">
            Photos are optional but help qualify leads. Try to include a storefront photo at minimum.
          </p>
        </div>

        {/* Three photo slots */}
        {SLOTS.map(slot => (
          <PhotoSlot
            key={slot.key}
            config={slot}
            file={files[slot.key]}
            preview={previews[slot.key]}
            loading={loading[slot.key]}
            onPick={handlePick}
            onRemove={handleRemove}
          />
        ))}

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          disabled={anyLoading}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            anyLoading
              ? 'bg-line text-muted-brand cursor-not-allowed'
              : 'bg-terra text-white shadow-lg shadow-terra/25 active:bg-terra-dark'
          }`}
        >
          {photoCount > 0
            ? `Continue with ${photoCount} photo${photoCount > 1 ? 's' : ''} →`
            : 'Skip photos & continue →'
          }
        </button>
      </div>

    </div>
  )
}
