'use client'

import { useRouter } from 'next/navigation'

interface Asset {
  id: string
  title: string
  file_type: string
  file_url: string
  thumbnail_url: string | null
  status: string
  day_of_week: string
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  uploaded: { label: 'Uploaded', className: 'bg-gray-100 text-gray-600' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-100 text-blue-600' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  posted:   { label: 'Posted',   className: 'bg-gray-800 text-white' },
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === 'video') return (
    <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  )
  if (type === 'document') return (
    <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
  return (
    <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

export function AssetCard({ asset }: { asset: Asset }) {
  const router = useRouter()
  const status = STATUS_STYLES[asset.status] ?? STATUS_STYLES.uploaded
  const isImage = asset.file_type === 'image' || asset.file_type === 'graphic'

  return (
    <button
      onClick={() => router.push(`/content-hub/asset/${asset.id}`)}
      className="bg-white rounded-2xl border border-green-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all text-left w-full group"
    >
      {/* Preview */}
      <div className="relative h-32 bg-gradient-to-br from-green-800 to-green-950 flex items-center justify-center overflow-hidden">
        {(isImage && (asset.thumbnail_url || asset.file_url)) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.thumbnail_url ?? asset.file_url}
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileTypeIcon type={asset.file_type} />
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-gray-900 truncate">{asset.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{asset.file_type}</p>
      </div>
    </button>
  )
}
