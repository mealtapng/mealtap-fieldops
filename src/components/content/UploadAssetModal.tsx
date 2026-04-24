'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  weekId: string
  onClose: () => void
  onUploaded: (asset: any) => void
}

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export function UploadAssetModal({ weekId, onClose, onUploaded }: Props) {
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const [title,             setTitle]             = useState('')
  const [description,       setDescription]       = useState('')
  const [dayOfWeek,         setDayOfWeek]         = useState(DAYS[0])
  const [captionInstagram,  setCaptionInstagram]  = useState('')
  const [captionTiktok,     setCaptionTiktok]     = useState('')
  const [captionFacebook,   setCaptionFacebook]   = useState('')
  const [captionX,          setCaptionX]          = useState('')
  const [captionLinkedin,   setCaptionLinkedin]   = useState('')
  const [hashtags,          setHashtags]          = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  function detectType(f: File): 'image' | 'video' | 'document' | 'graphic' {
    if (f.type.startsWith('image/')) return 'image'
    if (f.type.startsWith('video/')) return 'video'
    return 'document'
  }

  async function handleFile(f: File) {
    setError(null)
    const isVideo = f.type.startsWith('video/')
    const MAX = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (f.size > MAX) {
      setError(`File too large. Max ${isVideo ? '50MB for video' : '10MB for images/docs'}.`)
      return
    }

    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }

    // Upload immediately to Storage
    setUploading(true)
    const supabase = createClient()
    const ext  = f.name.split('.').pop()
    const path = `${weekId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('content-assets')
      .upload(path, f, { upsert: false })

    if (upErr) {
      setError('Upload failed. Check the content-assets bucket exists and is public.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('content-assets').getPublicUrl(path)
    setUploadedUrl(publicUrl)
    setUploading(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function save() {
    if (!uploadedUrl || !title.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/content/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_id:           weekId,
        day_of_week:       dayOfWeek,
        title:             title.trim(),
        description:       description.trim() || null,
        file_url:          uploadedUrl,
        file_type:         file ? detectType(file) : 'document',
        thumbnail_url:     (file?.type.startsWith('image/') ? uploadedUrl : null),
        caption_instagram: captionInstagram.trim() || null,
        caption_tiktok:    captionTiktok.trim() || null,
        caption_facebook:  captionFacebook.trim() || null,
        caption_x:         captionX.trim() || null,
        caption_linkedin:  captionLinkedin.trim() || null,
        hashtags:          hashtags.trim() || null,
        sort_order:        0,
      }),
    })

    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to save.'); return }
    onUploaded(json.asset)
    onClose()
  }

  const xLen = captionX.length

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Upload Content Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-green-200 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,video/mp4,video/quicktime,.pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Uploading…</p>
              </div>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain" />
            ) : uploadedUrl ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p className="text-sm font-semibold text-green-700">{file?.name}</p>
                <p className="text-xs text-gray-400">Tap to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-sm font-semibold text-gray-600">Tap to select or drag & drop</p>
                <p className="text-xs text-gray-400">Images, videos (MP4/MOV), PDFs · Max 50MB video, 10MB other</p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Morning reel – electricity saving tips"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief context for this content piece…"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Day <span className="text-red-400">*</span></label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white"
                >
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Captions */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">Captions</p>

            {[
              { label: '📸 Instagram', value: captionInstagram, set: setCaptionInstagram, max: 2200 },
              { label: '🎵 TikTok',    value: captionTiktok,    set: setCaptionTiktok,    max: 2200 },
              { label: '👥 Facebook',  value: captionFacebook,  set: setCaptionFacebook,  max: 63206 },
              { label: '🐦 X / Twitter', value: captionX,       set: setCaptionX,         max: 280 },
              { label: '💼 LinkedIn',  value: captionLinkedin,  set: setCaptionLinkedin,  max: 3000 },
            ].map(({ label, value, set, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500">{label}</label>
                  <span className={`text-[10px] ${value.length > max * 0.9 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {value.length}/{max}
                  </span>
                </div>
                <textarea
                  value={value}
                  onChange={e => set(e.target.value)}
                  rows={3}
                  placeholder={`Caption for ${label.replace(/^[^\s]+\s/, '')}…`}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-none"
                />
                {label.includes('Twitter') && xLen > 280 && (
                  <p className="text-xs text-red-500 mt-0.5">Exceeds 280 character limit for X/Twitter</p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1"># Hashtags</label>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#PowerChat #electricity #Nigeria"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pb-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!uploadedUrl || !title.trim() || saving}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: '#1B5E20' }}
            >
              {saving ? 'Saving…' : 'Save Asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
