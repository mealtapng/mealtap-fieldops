'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Asset {
  id: string; title: string; description: string | null
  file_url: string; file_type: string; thumbnail_url: string | null
  caption_instagram: string | null; caption_tiktok: string | null
  caption_facebook: string | null; caption_x: string | null; caption_linkedin: string | null
  hashtags: string | null; status: string
  day_of_week: string
  posted_at: string | null
  uploader: { id: string; full_name: string } | null
  poster: { id: string; full_name: string } | null
  week: { id: string; title: string; start_date: string; end_date: string; week_number: number } | null
  created_at: string
}

interface Props {
  asset: Asset
  currentUserId: string
  isAdmin: boolean
}

const STATUSES = ['uploaded','reviewed','approved','posted']
const STATUS_STYLE: Record<string, string> = {
  uploaded: 'bg-gray-100 text-gray-600',
  reviewed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  posted:   'bg-gray-800 text-white',
}

const PLATFORMS = [
  { key: 'caption_instagram', label: '📸 Instagram', max: 2200,  color: '#E1306C' },
  { key: 'caption_tiktok',    label: '🎵 TikTok',    max: 2200,  color: '#69C9D0' },
  { key: 'caption_facebook',  label: '👥 Facebook',  max: 63206, color: '#1877F2' },
  { key: 'caption_x',         label: '🐦 X / Twitter', max: 280, color: '#1DA1F2' },
  { key: 'caption_linkedin',  label: '💼 LinkedIn',  max: 3000,  color: '#0A66C2' },
] as const

function CopyButton({ text }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for Android WebView
      const el = document.createElement('textarea')
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0'
      document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {copied ? (
        <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
      ) : (
        <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
      )}
    </button>
  )
}

export function AssetDetailView({ asset: initialAsset }: Props) {
  const [asset,    setAsset]    = useState<Asset>(initialAsset)
  const [updating, setUpdating] = useState(false)
  const [statusErr,setStatusErr]= useState<string | null>(null)

  async function updateStatus(status: string) {
    setUpdating(true); setStatusErr(null)
    const res = await fetch(`/api/content/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    setUpdating(false)
    if (!res.ok) { setStatusErr(json.error ?? 'Failed to update'); return }
    setAsset(json.asset)
  }

  const isImage = asset.file_type === 'image' || asset.file_type === 'graphic'
  const isVideo = asset.file_type === 'video'

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-green-100 sticky top-0 z-20">
        <Link
          href="/content-hub"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{asset.title}</p>
          {asset.week && (
            <p className="text-xs text-gray-400">Week {asset.week.week_number} · {asset.week.title} · {asset.day_of_week}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex-shrink-0 ${STATUS_STYLE[asset.status]}`}>
          {asset.status}
        </span>
      </div>

      <div className="px-6 py-5 max-w-3xl space-y-6">

        {/* Preview + Download */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.file_url} alt={asset.title} className="w-full max-h-[50vh] object-contain bg-gray-50" />
          ) : isVideo ? (
            <video src={asset.file_url} controls className="w-full max-h-[50vh] bg-black" />
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p className="text-sm text-gray-400">{asset.file_type.toUpperCase()} file</p>
              </div>
            </div>
          )}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div>
              {asset.description && <p className="text-sm text-gray-600">{asset.description}</p>}
              {asset.uploader && <p className="text-xs text-gray-400 mt-0.5">Uploaded by {asset.uploader.full_name}</p>}
            </div>
            <a
              href={asset.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: '#1B5E20' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </a>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-green-100 px-5 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || asset.status === s}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all disabled:cursor-default ${
                  asset.status === s
                    ? `${STATUS_STYLE[s]} ring-2 ring-offset-1 ring-green-400`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-100'
                }`}
              >
                {updating && asset.status !== s ? '…' : s}
              </button>
            ))}
          </div>
          {asset.status === 'posted' && asset.poster && asset.posted_at && (
            <p className="text-xs text-gray-400 mt-2">
              Marked as posted by {asset.poster.full_name} on {new Date(asset.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {statusErr && <p className="text-xs text-red-500 mt-2">{statusErr}</p>}
        </div>

        {/* Captions */}
        {PLATFORMS.map(({ key, label, max, color }) => {
          const text = asset[key as keyof Asset] as string | null
          if (!text) return null
          return (
            <div key={key} className="bg-white rounded-2xl border border-green-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-bold" style={{ color }}>{label}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${text.length > max * 0.9 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {text.length}/{max}
                  </span>
                  <CopyButton text={text} label={label} />
                </div>
              </div>
              <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>
          )
        })}

        {/* Hashtags */}
        {asset.hashtags && (
          <div className="bg-white rounded-2xl border border-green-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700"># Hashtags</p>
              <CopyButton text={asset.hashtags} label="hashtags" />
            </div>
            <p className="text-sm text-green-700 font-medium">{asset.hashtags}</p>
          </div>
        )}

      </div>
    </div>
  )
}
