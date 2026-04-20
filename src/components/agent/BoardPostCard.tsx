'use client'

import { timeAgo } from '@/lib/format'
import { ReactionBar } from './ReactionBar'

interface Author {
  id:        string
  full_name: string
  role:      string
}

interface Reaction {
  id:         string
  post_id:    string
  user_id:    string
  emoji:      string
  created_at: string
}

interface Post {
  id:         string
  body:       string
  is_pinned:  boolean
  post_type:  string
  created_at: string
  author:     Author | null
}

interface Props {
  post:             Post
  reactions:        Reaction[]
  currentUserId:    string
  onReactionsChange: (postId: string, updated: Reaction[]) => void
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleLabel(role: string) {
  if (role === 'admin')      return 'Admin'
  if (role === 'field_lead') return 'Field Lead'
  return 'Agent'
}

export function BoardPostCard({ post, reactions, currentUserId, onReactionsChange }: Props) {
  return (
    <div className="space-y-1">
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] font-bold tracking-widest text-terra uppercase">
            📌 Pinned · {roleLabel(post.author?.role ?? 'admin')}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-line p-4">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {post.author ? initials(post.author.full_name) : '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink leading-tight truncate">
              {post.author?.full_name ?? 'Unknown'}
            </p>
            <p className="text-[11px] text-muted-brand">
              {roleLabel(post.author?.role ?? '')} · {timeAgo(post.created_at)}
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{post.body}</p>

        {/* Reactions */}
        <ReactionBar
          postId={post.id}
          reactions={reactions}
          currentUserId={currentUserId}
          onReactionsChange={updated => onReactionsChange(post.id, updated)}
        />
      </div>
    </div>
  )
}
