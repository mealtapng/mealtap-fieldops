'use client'

import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import type { Step3Data } from '@/lib/capture-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step3Data | null
  onContinue:  (data: Step3Data) => void
}

type PhotoKey = 'storefront' | 'menu' | 'dish' | 'owner'

interface PhotoSlot {
  key:         PhotoKey
  label:       string
  description: string
  required:    boolean
  icon:        string
}

// ── Config ────────────────────────────────────────────────────────────────────

const SLOTS: PhotoSlot[] = [
  { key: 'storefront', label: 'Storefront',   description: 'Outside view of the restaurant', required: true,  icon: '🏪' },
  { key: 'menu',       label: 'Menu',         description: 'Menu board or price list',        required: true,  icon: '📋' },
  { key: 'dish',       label: 'Dish (sample)', description: 'A popular dish they serve',     required: false, icon: '🍽️' },
  { key: 'owner',      label: 'Owner photo',  description: 'Photo of the restaurant owner',  required: false, icon: '👤' },
]

const COMPRESS_OPTS = {
  maxSizeMB:            0.5,
  maxWidthOrHeight:     1200,
  useWebWorker:         true,
  fileType:             'image/jpeg' as const,
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaptureStep3Photos({ initialData: initial, onContinue }: Props) {
  const supabase = createClient()

  const [paths, setPaths] = useState<Partial<Record<PhotoKey, string>>>({
    storefront: initial?.storefrontPath ?? undefined,
    menu:       initial?.menuPath       ?? undefined,
    dish:       initial?.dishPath       ?? undefined,
    owner:      initial?.ownerPath      ?? undefined,
  })
  const [previews, setPreviews] = useState<Partial<Record<PhotoKey, string>>>({})
  const [uploading, setUploading] = useState<Partial<Record<PhotoKey, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<PhotoKey, string>>>({})

  const inputRefs = {
    storefront: useRef<HTMLInputElement>(null),
    menu:       useRef<HTMLInputElement>(null),
    dish:       useRef<HTMLInputElement>(null),
    owner:      useRef<HTMLInputElement>(null),
  }

  const canContinue = !!paths.storefront && !!paths.menu

  async function handleFileChange(key: PhotoKey, file: File) {
    setErrors(e => ({ ...e, [key]: undefined }))
    setUploading(u => ({ ...u, [key]: true }))

    try {
      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreviews(p => ({ ...p, [key]: objectUrl }))

      // Compress before upload
      const compressed = await imageCompression(file, COMPRESS_OPTS)

      // Upload to restaurant-photos bucket
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext  = 'jpg'
      const path = `${user.id}/${Date.now()}_${key}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('restaurant-photos')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      setPaths(p => ({ ...p, [key]: path }))
    } catch (err: unknown) {
      setErrors(e => ({ ...e, [key]: err instanceof Error ? err.message : 'Upload failed' }))
      setPreviews(p => ({ ...p, [key]: undefined }))
    } finally {
      setUploading(u => ({ ...u, [key]: false }))
    }
  }

  function handleContinue() {
    if (!canContinue) return
    onContinue({
      storefrontPath: paths.storefront ?? null,
      menuPath:       paths.menu       ?? null,
      dishPath:       paths.dish       ?? null,
      ownerPath:      paths.owner      ?? null,
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-3 pb-4">

        {/* Info */}
        <div className="bg-forest/10 rounded-2xl px-4 py-3.5 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">📸</span>
          <p className="text-xs text-forest font-medium leading-relaxed">
            Storefront and menu photos are required. Dish and owner photos are optional but
            improve the quality score.
          </p>
        </div>

        {/* Photo slots */}
        {SLOTS.map(slot => {
          const path     = paths[slot.key]
          const preview  = previews[slot.key]
          const busy     = uploading[slot.key]
          const err      = errors[slot.key]
          const uploaded = !!path && !busy

          return (
            <div key={slot.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 flex items-center gap-4">
                {/* Thumbnail or placeholder */}
                <div
                  className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center ${
                    uploaded || preview ? '' : 'bg-cream border-2 border-dashed border-line'
                  }`}
                >
                  {busy ? (
                    <div className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
                  ) : preview || uploaded ? (
                    preview ? (
                      <img src={preview} alt={slot.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-forest/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )
                  ) : (
                    <span className="text-2xl">{slot.icon}</span>
                  )}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-ink">{slot.label}</p>
                    {slot.required && (
                      <span className="text-[10px] font-bold text-terra">Required</span>
                    )}
                    {uploaded && (
                      <span className="text-[10px] font-bold text-forest">✓ Uploaded</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">{slot.description}</p>
                  {err && <p className="text-[11px] text-red-500 mt-0.5">{err}</p>}
                </div>

                {/* Upload / re-upload button */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRefs[slot.key].current?.click()}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    uploaded
                      ? 'bg-cream text-forest border border-line'
                      : 'bg-forest text-white'
                  } disabled:opacity-40`}
                >
                  {busy ? '…' : uploaded ? 'Re-upload' : 'Upload'}
                </button>

                {/* Hidden file input */}
                <input
                  ref={inputRefs[slot.key]}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(slot.key, file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          )
        })}

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canContinue
              ? 'bg-forest text-white shadow-lg shadow-forest/25 active:bg-forest-dark'
              : 'bg-line text-muted cursor-not-allowed'
          }`}
        >
          Continue to tag & notes →
        </button>
        {!canContinue && (
          <p className="text-[11px] text-center text-muted mt-1.5">
            Upload storefront and menu photos to continue
          </p>
        )}
      </div>
    </div>
  )
}
