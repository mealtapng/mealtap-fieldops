'use client'

import { useState } from 'react'
import { ThisWeekView } from './ThisWeekView'
import { CalendarView } from './CalendarView'
import { ContentBoardView } from './ContentBoardView'

interface CurrentUser { id: string; full_name: string; role: string }
interface Week {
  id: string; title: string; start_date: string; end_date: string
  week_number: number; status: string; asset_count: number
  general_instructions: string | null
}
interface Asset {
  id: string; title: string; file_type: string; file_url: string
  thumbnail_url: string | null; status: string; day_of_week: string
}
interface Post { id: string; body: string; is_pinned: boolean; created_at: string; author: any }
interface Reaction { id: string; post_id: string; user_id: string; emoji: string }

type Tab = 'week' | 'calendar' | 'board'

interface Props {
  currentUser:    CurrentUser
  initialTab:     Tab
  weeks:          Week[]
  activeWeek:     Week | null
  activeAssets:   Asset[]
  boardPosts:     Post[]
  boardReactions: Reaction[]
}

export function ContentHubView({
  currentUser, initialTab, weeks: initialWeeks,
  activeWeek: initialActiveWeek, activeAssets: initialAssets,
  boardPosts, boardReactions,
}: Props) {
  const [tab,         setTab]         = useState<Tab>(initialTab)
  const [weeks,       setWeeks]       = useState<Week[]>(initialWeeks)
  const [activeWeek] = useState<Week | null>(initialActiveWeek)
  const [assets,      setAssets]      = useState<Asset[]>(initialAssets)

  const isAdmin    = currentUser.role === 'admin'
  const canUpload  = isAdmin || currentUser.role === 'content_manager'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'week',     label: '📅 This Week' },
    { key: 'calendar', label: '🗓️ Calendar' },
    { key: 'board',    label: '💬 Message Board' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-green-100 bg-white sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B5E20' }}>Content Hub</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {currentUser.role === 'admin' ? 'Admin' : 'Content Manager'} · {currentUser.full_name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-2 bg-white border-b border-green-50 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-white shadow-sm border border-green-200 text-green-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-5 max-w-4xl">

        {tab === 'week' && (
          activeWeek ? (
            <ThisWeekView
              week={activeWeek}
              assets={assets}
              canUpload={canUpload}
              onAssetAdded={a => setAssets(prev => [...prev, a])}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-green-100 p-12 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-base font-bold text-gray-700">No active week</p>
              <p className="text-sm text-gray-400 mt-1.5">
                {isAdmin
                  ? 'Go to the Calendar tab to create a week and set it to Active.'
                  : 'No content has been published for this week yet. Check back soon.'}
              </p>
            </div>
          )
        )}

        {tab === 'calendar' && (
          <CalendarView
            weeks={weeks}
            isAdmin={isAdmin}
            onWeekCreated={w => {
              setWeeks(prev => [w, ...prev])
              setTab('week')
            }}
          />
        )}

        {tab === 'board' && (
          <ContentBoardView
            posts={boardPosts}
            reactions={boardReactions}
            currentUserId={currentUser.id}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}
