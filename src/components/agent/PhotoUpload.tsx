'use client'

import { useEffect, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'

interface PhotoUploadProps {
  userId: string
  initialPath: string | null
  fullName: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function PhotoUpload({ userId, initialPath, fullName }: PhotoUploadProps) {
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const prevUrlRef                    = useRef<string | null>(null)

  // Resolve storage path → public URL on mount
  useEffect(() => {
    if (!initialPath) return
    const supabase = createClient()
    const { data } = supabase.storage.from('user-photos').getPublicUrl(initialPath)
    if (data?.publicUrl) {
      setPreviewUrl(data.publicUrl)
      prevUrlRef.current = data.publicUrl
    }
  }, [initialPath])

  function showError(msg: string) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 3000)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected after an error
    e.target.value = ''

    // Validate type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file.')
      return
    }
    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be under 5 MB.')
      return
    }

    // Instant preview
    const objectUrl = URL.createObjectURL(file)
    prevUrlRef.current = previewUrl
    setPreviewUrl(objectUrl)
    setUploading(true)

    try {
      // Compress to max 512×512 / 0.5 MB
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })

      const supabase = createClient()
      const storagePath = `${userId}/passport.jpg`

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(storagePath, compressed, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Use the server-side API route to write to the DB — this guarantees
      // the request carries the session cookie and RLS resolves correctly.
      const res = await fetch('/api/profile/update-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: storagePath }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      // Keep the object URL as the new preview (no extra round-trip needed)
      prevUrlRef.current = objectUrl
    } catch {
      // Revert to previous avatar
      setPreviewUrl(prevUrlRef.current)
      showError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const initials = getInitials(fullName)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar + tap target */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative focus:outline-none"
        aria-label="Change profile photo"
      >
        {/* Avatar */}
        <div
          className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
          style={{ boxShadow: '0 0 0 4px #25D366' }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
            >
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
          )}
        </div>

        {/* Upload spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <svg
              className="animate-spin w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}

        {/* Camera badge */}
        <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg
            className="w-4 h-4" style={{ color: '#1B5E20' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs font-semibold text-red-500 text-center">{errorMsg}</p>
      )}
    </div>
  )
}
