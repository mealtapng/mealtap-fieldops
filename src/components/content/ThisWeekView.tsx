'use client'

import { useState } from 'react'
import { AssetCard } from './AssetCard'
import { UploadAssetModal } from './UploadAssetModal'

interface Asset {
  id: string; title: string; file_type: string; file_url: string
  thumbnail_url: string | null; status: string; day_of_week: string
}

interface Week {
  id: string; title: string; start_date: string; end_date: string
  week_number: number; status: string; general_instructions: string | null
}

interface Props {
  week: Week
  assets: Asset[]
  canUpload: boolean
  onAssetAdded: (asset: Asset) => void
}

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function fmt(dateStr: string, dayName: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const dayIndex = DAYS.indexOf(dayName)
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - d.getDay() + 1) // Monday
  const target = new Date(weekStart)
  target.setDate(weekStart.getDate() + dayIndex)
  return target.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function DaySection({
  day, assets, weekId, weekStartDate, canUpload, onAssetAdded,
}: {
  day: string; assets: Asset[]; weekId: string; weekStartDate: string
  canUpload: boolean; onAssetAdded: (a: Asset) => void
}) {
  const [open,   setOpen]   = useState(true)
  const [upload, setUpload] = useState(false)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const isToday = day === today

  return (
    <div className={`rounded-2xl border overflow-hidden ${isToday ? 'border-green-400 shadow-sm shadow-green-100' : 'border-green-100'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
          isToday ? 'bg-green-700 text-white' : 'bg-white hover:bg-green-50/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {isToday && <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">TODAY</span>}
          <div>
            <p className={`font-bold text-sm ${isToday ? 'text-white' : 'text-gray-900'}`}>{day}</p>
            <p className={`text-[11px] ${isToday ? 'text-white/70' : 'text-gray-400'}`}>{fmt(weekStartDate, day)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold ${isToday ? 'text-white/70' : 'text-gray-400'}`}>
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${isToday ? 'text-white/70' : 'text-gray-400'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="bg-white px-5 py-4">
          {assets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No content for {day} yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
              {assets.map(a => <AssetCard key={a.id} asset={a} />)}
            </div>
          )}
          {canUpload && (
            <button
              onClick={() => setUpload(true)}
              className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add content
            </button>
          )}
        </div>
      )}

      {upload && (
        <UploadAssetModal
          weekId={weekId}
          onClose={() => setUpload(false)}
          onUploaded={a => { onAssetAdded(a); setUpload(false) }}
        />
      )}
    </div>
  )
}

export function ThisWeekView({ week, assets, canUpload, onAssetAdded }: Props) {
  const [showInstructions, setShowInstructions] = useState(false)

  const fmt2 = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Week {week.week_number}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                week.status === 'active' ? 'bg-green-50 text-green-700' :
                week.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                'bg-yellow-50 text-yellow-700'
              }`}>{week.status}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{week.title}</h2>
            <p className="text-sm text-gray-400">{fmt2(week.start_date)} – {fmt2(week.end_date)}</p>
          </div>
          {week.general_instructions && (
            <button
              onClick={() => setShowInstructions(s => !s)}
              className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {showInstructions ? 'Hide' : 'Show'} instructions
            </button>
          )}
        </div>
        {showInstructions && week.general_instructions && (
          <div className="px-6 pb-5 border-t border-green-50">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pt-4">{week.general_instructions}</p>
          </div>
        )}
      </div>

      {/* Day sections */}
      {DAYS.map(day => (
        <DaySection
          key={day}
          day={day}
          assets={assets.filter(a => a.day_of_week === day)}
          weekId={week.id}
          weekStartDate={week.start_date}
          canUpload={canUpload}
          onAssetAdded={onAssetAdded}
        />
      ))}
    </div>
  )
}
