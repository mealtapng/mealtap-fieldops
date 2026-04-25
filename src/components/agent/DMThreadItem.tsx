'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/format'

interface OtherUser {
  id:        string
  full_name: string
  role:      string
}

interface Thread {
  id:              string
  created_at:      string
  last_message_at: string | null
}

interface Props {
  thread:      Thread
  otherUser:   OtherUser
  unreadCount: number
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleLabel(role: string) {
  if (role === 'admin')      return 'Admin'
  if (role === 'field_lead') return 'Field Lead'
  return 'Agent'
}

export function DMThreadItem({ thread, otherUser, unreadCount }: Props) {
  const timestamp = thread.last_message_at ?? thread.created_at

  return (
    <Link
      href={`/messages/${thread.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-line px-4 py-3.5 active:bg-cream transition-colors"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center">
          <span className="text-xs font-bold text-white">{initials(otherUser.full_name)}</span>
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink truncate">{otherUser.full_name}</p>
          <p className="text-[11px] text-muted flex-shrink-0">{timeAgo(timestamp)}</p>
        </div>
        <p className="text-[11px] text-muted mt-0.5">{roleLabel(otherUser.role)}</p>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
        </div>
      )}
    </Link>
  )
}
