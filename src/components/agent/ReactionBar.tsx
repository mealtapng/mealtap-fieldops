'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EMOJI_OPTIONS = ['🔥', '💪', '👏', '❤️', '😂']

interface Reaction {
  id:         string
  post_id:    string
  user_id:    string
  emoji:      string
  created_at: string
}

interface Props {
  postId:           string
  reactions:        Reaction[]
  currentUserId:    string
  onReactionsChange: (updated: Reaction[]) => void
}

export function ReactionBar({ postId, reactions, currentUserId, onReactionsChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  // Group reactions by emoji
  const grouped = EMOJI_OPTIONS.reduce<Record<string, Reaction[]>>((acc, emoji) => {
    acc[emoji] = reactions.filter(r => r.emoji === emoji)
    return acc
  }, {})

  // Only show emoji that have reactions, plus a minimal "+ add" row
  const activeEmoji = EMOJI_OPTIONS.filter(e => grouped[e].length > 0)
  const canAddMore  = activeEmoji.length < EMOJI_OPTIONS.length

  async function toggle(emoji: string) {
    if (loading) return
    setLoading(emoji)
    const supabase = createClient()
    const myReaction = reactions.find(r => r.emoji === emoji && r.user_id === currentUserId)

    if (myReaction) {
      // Optimistic remove
      onReactionsChange(reactions.filter(r => r.id !== myReaction.id))
      await (supabase as any).from('board_reactions').delete().eq('id', myReaction.id)
    } else {
      // Optimistic add
      const optimistic: Reaction = {
        id: `tmp-${Date.now()}`,
        post_id: postId,
        user_id: currentUserId,
        emoji,
        created_at: new Date().toISOString(),
      }
      onReactionsChange([...reactions, optimistic])
      const { data } = await (supabase as any)
        .from('board_reactions')
        .insert({ post_id: postId, user_id: currentUserId, emoji })
        .select()
        .single()
      // Replace optimistic with real row
      if (data) {
        onReactionsChange([...reactions.filter(r => r.id !== optimistic.id), data as Reaction])
      }
    }
    setLoading(null)
  }

  const [showPicker, setShowPicker] = useState(false)

  if (activeEmoji.length === 0 && !showPicker) {
    return (
      <div className="flex items-center gap-1 pt-2 border-t border-line mt-2">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-line text-xs text-muted hover:border-terra hover:text-terra transition-colors"
        >
          <span>+</span>
          <span>React</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line mt-2">
      {EMOJI_OPTIONS.filter(e => grouped[e].length > 0 || showPicker).map(emoji => {
        const count  = grouped[emoji].length
        const isMine = grouped[emoji].some(r => r.user_id === currentUserId)
        if (count === 0 && !showPicker) return null
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={loading === emoji}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors
              ${isMine
                ? 'bg-forest-light border-forest text-brand'
                : 'bg-cream border-line text-muted hover:border-terra'
              }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        )
      })}
      {!showPicker && canAddMore && (
        <button
          onClick={() => setShowPicker(true)}
          className="px-2 py-1 rounded-full border border-dashed border-line text-xs text-muted hover:border-terra hover:text-terra transition-colors"
        >
          +
        </button>
      )}
      {showPicker && (
        <button
          onClick={() => setShowPicker(false)}
          className="px-2 py-1 rounded-full border border-line text-xs text-muted"
        >
          ✕
        </button>
      )}
    </div>
  )
}
