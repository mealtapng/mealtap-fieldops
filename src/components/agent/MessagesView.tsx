'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BoardPostCard } from './BoardPostCard'
import { DMThreadItem } from './DMThreadItem'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CurrentUser {
  id:        string
  role:      string
  full_name: string
}

interface Author {
  id:        string
  full_name: string
  role:      string
}

interface Post {
  id:         string
  body:       string
  is_pinned:  boolean
  post_type:  string
  created_at: string
  author:     Author | null
}

interface Reaction {
  id:         string
  post_id:    string
  user_id:    string
  emoji:      string
  created_at: string
}

interface OtherUser {
  id:        string
  full_name: string
  role:      string
}

interface Thread {
  id:              string
  agent_id:        string
  supervisor_id:   string
  created_at:      string
  last_message_at: string | null
  agent:           OtherUser
  supervisor:      OtherUser
}

interface SupervisorOption {
  id:        string
  full_name: string
  role:      string
}

interface Props {
  currentUser:      CurrentUser
  posts:            Post[]
  reactions:        Reaction[]
  threads:          Thread[]
  unreadCounts:     Record<string, number>
  supervisorOptions: SupervisorOption[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function isAdminOrLead(role: string) {
  return role === 'admin' || role === 'field_lead'
}

// ── New Post Modal ────────────────────────────────────────────────────────────

interface NewPostModalProps {
  currentUserId: string
  onClose:       () => void
  onPosted:      (post: Post) => void
}

function NewPostModal({ currentUserId, onClose, onPosted }: NewPostModalProps) {
  const [body,     setBody]     = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [posting,  setPosting]  = useState(false)

  async function submit() {
    if (!body.trim() || posting) return
    setPosting(true)
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('board_posts')
      .insert({ posted_by: currentUserId, body: body.trim(), is_pinned: isPinned, post_type: 'announcement' })
      .select('*, author:users!posted_by(id, full_name, role)')
      .single()
    setPosting(false)
    if (!error && data) {
      onPosted(data as Post)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-ink">New post</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-cream text-muted-brand">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <textarea
          autoFocus
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your announcement…"
          rows={4}
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra resize-none"
        />

        <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={e => setIsPinned(e.target.checked)}
            className="w-4 h-4 rounded accent-terra"
          />
          <span className="text-sm text-ink font-medium">📌 Pin this post</span>
        </label>

        <button
          onClick={submit}
          disabled={!body.trim() || posting}
          className={`w-full mt-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
            body.trim() && !posting
              ? 'bg-terra text-white shadow-lg shadow-terra/25 active:bg-terra-dark'
              : 'bg-line text-muted-brand cursor-not-allowed'
          }`}
        >
          {posting ? 'Posting…' : 'Post to Team Board'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MessagesView({
  currentUser,
  posts: initialPosts,
  reactions: initialReactions,
  threads,
  unreadCounts,
  supervisorOptions,
}: Props) {
  const router = useRouter()
  const [activeTab,       setActiveTab]       = useState<'board' | 'direct'>('board')
  const [posts,           setPosts]           = useState<Post[]>(initialPosts)
  const [reactions,       setReactions]       = useState<Reaction[]>(initialReactions)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [creatingThread,  setCreatingThread]  = useState(false)

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  // ── Board Realtime ──────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('board-posts-realtime')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'board_posts' },
        async (payload: any) => {
          // Payload lacks joined author — fetch full post
          const { data } = await supabase
            .from('board_posts' as any)
            .select('*, author:users!posted_by(id, full_name, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setPosts(prev => {
              // Don't duplicate if already present
              if (prev.find(p => p.id === (data as Post).id)) return prev
              const newPost = data as Post
              // Pinned posts go before other pinned posts (or at top if none)
              if (newPost.is_pinned) return [newPost, ...prev]
              const firstUnpinned = prev.findIndex(p => !p.is_pinned)
              if (firstUnpinned === -1) return [...prev, newPost]
              return [...prev.slice(0, firstUnpinned), newPost, ...prev.slice(firstUnpinned)]
            })
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Reactions change handler ────────────────────────────────────────────────
  function handleReactionsChange(postId: string, updated: Reaction[]) {
    setReactions(prev => [...prev.filter(r => r.post_id !== postId), ...updated])
  }

  // ── Create DM thread ────────────────────────────────────────────────────────
  async function handleCreateThread(supervisorId: string) {
    setCreatingThread(true)
    const res = await fetch('/api/messages/create-thread', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ supervisorId }),
    })
    const json = await res.json()
    setCreatingThread(false)
    if (json.threadId) router.push(`/messages/${json.threadId}`)
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2 flex-shrink-0">
        <h1 className="text-xl font-bold text-ink">Messages</h1>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1.5 bg-line/40 rounded-2xl mx-4 mb-3 flex-shrink-0">
        {(['board', 'direct'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-white shadow text-ink' : 'text-muted-brand'
            }`}
          >
            {tab === 'board' ? '📢 Team Board' : '💬 Direct'}
            {tab === 'direct' && totalUnread > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

        {/* Board tab */}
        {activeTab === 'board' && (
          <>
            {posts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-20 text-center">
                <div>
                  <p className="text-3xl mb-2">📢</p>
                  <p className="text-sm font-semibold text-ink">No posts yet</p>
                  <p className="text-xs text-muted-brand mt-1">Announcements from your field lead will appear here.</p>
                </div>
              </div>
            ) : (
              posts.map(post => (
                <BoardPostCard
                  key={post.id}
                  post={post}
                  reactions={reactions.filter(r => r.post_id === post.id)}
                  currentUserId={currentUser.id}
                  onReactionsChange={handleReactionsChange}
                />
              ))
            )}
          </>
        )}

        {/* Direct tab */}
        {activeTab === 'direct' && (
          <>
            {threads.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-3xl">💬</p>
                <div>
                  <p className="text-sm font-semibold text-ink">No messages yet</p>
                  <p className="text-xs text-muted-brand mt-1">
                    {currentUser.role === 'agent'
                      ? 'Start a conversation with your supervisor.'
                      : 'No agent threads yet.'}
                  </p>
                </div>
                {currentUser.role === 'agent' && supervisorOptions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {supervisorOptions.map(sup => (
                      <button
                        key={sup.id}
                        onClick={() => handleCreateThread(sup.id)}
                        disabled={creatingThread}
                        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-line px-4 py-3.5 active:bg-cream transition-colors disabled:opacity-60"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {initials(sup.full_name)}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-ink">{sup.full_name}</p>
                          <p className="text-[11px] text-muted-brand">{sup.role === 'admin' ? 'Admin' : 'Field Lead'}</p>
                        </div>
                        <svg className="w-4 h-4 text-muted-brand ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              threads.map(thread => {
                const otherUser = thread.agent_id === currentUser.id
                  ? thread.supervisor
                  : thread.agent
                return (
                  <DMThreadItem
                    key={thread.id}
                    thread={thread}
                    otherUser={otherUser}
                    unreadCount={unreadCounts[thread.id] ?? 0}
                  />
                )
              })
            )}
          </>
        )}
      </div>

      {/* ── FAB: new post (admin/lead only) ────────────────────────────────── */}
      {isAdminOrLead(currentUser.role) && activeTab === 'board' && (
        <button
          onClick={() => setShowNewPostModal(true)}
          className="fixed bottom-20 right-4 w-13 h-13 w-14 h-14 bg-terra text-white rounded-full shadow-lg shadow-terra/30 flex items-center justify-center active:bg-terra-dark transition-colors z-30"
          aria-label="New post"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      )}

      {/* ── New post modal ──────────────────────────────────────────────────── */}
      {showNewPostModal && (
        <NewPostModal
          currentUserId={currentUser.id}
          onClose={() => setShowNewPostModal(false)}
          onPosted={post => {
            setPosts(prev =>
              post.is_pinned
                ? [post, ...prev]
                : (() => {
                    const first = prev.findIndex(p => !p.is_pinned)
                    if (first === -1) return [...prev, post]
                    return [...prev.slice(0, first), post, ...prev.slice(first)]
                  })()
            )
          }}
        />
      )}
    </>
  )
}
