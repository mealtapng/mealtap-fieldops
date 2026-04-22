'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BoardPostCard } from '@/components/agent/BoardPostCard'
import { timeAgo } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CurrentUser { id: string; full_name: string; role: string }

interface Author { id: string; full_name: string; role: string }

interface Post {
  id: string; body: string; is_pinned: boolean; post_type: string
  created_at: string; author: Author | null
}

interface Reaction {
  id: string; post_id: string; user_id: string; emoji: string; created_at: string
}

interface OtherUser { id: string; full_name: string; role: string }

interface Thread {
  id: string; agent_id: string; supervisor_id: string
  created_at: string; last_message_at: string | null
  agent: OtherUser; supervisor: OtherUser
}

interface Agent { id: string; full_name: string; employee_id: string; role: string }

interface Props {
  currentUser:  CurrentUser
  posts:        Post[]
  reactions:    Reaction[]
  threads:      Thread[]
  unreadCounts: Record<string, number>
  agents:       Agent[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleLabel(role: string) {
  if (role === 'admin')      return 'Admin'
  if (role === 'field_lead') return 'Field Lead'
  return 'Agent'
}

// ── New Broadcast Modal ───────────────────────────────────────────────────────

function BroadcastModal({
  onClose,
  onPosted,
}: {
  onClose:  () => void
  onPosted: (post: Post) => void
}) {
  const [body,     setBody]     = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [posting,  setPosting]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function submit() {
    if (!body.trim() || posting) return
    setPosting(true)
    setError(null)
    const res = await fetch('/api/admin/messages/broadcast', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ body: body.trim(), isPinned }),
    })
    const json = await res.json()
    setPosting(false)
    if (!res.ok) { setError(json.error ?? 'Failed to post. Try again.'); return }
    onPosted(json.post as Post)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink">New Broadcast</h2>
          <button onClick={onClose} className="text-muted-brand hover:text-ink text-xl leading-none">×</button>
        </div>

        <textarea
          autoFocus
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your announcement to all agents…"
          rows={5}
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
        />

        <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={e => setIsPinned(e.target.checked)}
            className="w-4 h-4 rounded accent-success"
          />
          <span className="text-sm text-ink font-medium">📌 Pin this post</span>
        </label>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted-brand hover:text-ink hover:border-ink/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!body.trim() || posting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success/90 disabled:opacity-60 transition-colors"
          >
            {posting ? 'Posting…' : 'Post to Team Board'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Message Modal (agent picker) ─────────────────────────────────────────

function NewMessageModal({
  agents,
  onClose,
  onSelect,
  loading,
}: {
  agents:   Agent[]
  onClose:  () => void
  onSelect: (agentId: string) => void
  loading:  boolean
}) {
  const [search, setSearch] = useState('')
  const filtered = agents.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">New Message</h2>
          <button onClick={onClose} className="text-muted-brand hover:text-ink text-xl leading-none">×</button>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents…"
          autoFocus
          className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink placeholder:text-muted-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand mb-3"
        />

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-brand text-center py-6">No agents found</p>
          ) : filtered.map(agent => (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream transition-colors disabled:opacity-60 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials(agent.full_name)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
                <p className="text-xs text-muted-brand">{agent.employee_id} · {roleLabel(agent.role)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminMessagesView({
  currentUser,
  posts: initialPosts,
  reactions: initialReactions,
  threads: initialThreads,
  unreadCounts: initialUnreadCounts,
  agents,
}: Props) {
  const router = useRouter()

  const [activeTab,         setActiveTab]         = useState<'board' | 'direct' | 'agent-chats'>('board')
  const [posts,             setPosts]             = useState<Post[]>(initialPosts)
  const [reactions,         setReactions]         = useState<Reaction[]>(initialReactions)
  const [threads]                                  = useState<Thread[]>(initialThreads)
  const [unreadCounts,      setUnreadCounts]      = useState<Record<string, number>>(initialUnreadCounts)
  const [showBroadcast,     setShowBroadcast]     = useState(false)
  const [showNewMessage,    setShowNewMessage]    = useState(false)
  const [startingThread,    setStartingThread]    = useState(false)
  const [deletingPostId,    setDeletingPostId]    = useState<string | null>(null)

  // Split threads: agent-to-agent vs admin/lead↔agent
  const agentToAgentThreads = threads.filter(t =>
    t.agent.role === 'agent' && t.supervisor.role === 'agent'
  )
  const directThreads = threads.filter(t =>
    t.agent.role !== 'agent' || t.supervisor.role !== 'agent'
  )

  const directUnread     = directThreads.reduce((s, t) => s + (unreadCounts[t.id] ?? 0), 0)
  const agentChatsUnread = agentToAgentThreads.reduce((s, t) => s + (unreadCounts[t.id] ?? 0), 0)

  // ── Board Realtime ──────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-board-posts-realtime')
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'board_posts' },
        async (payload: any) => {
          const { data } = await (supabase as any)
            .from('board_posts')
            .select('*, author:users!posted_by(id, full_name, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setPosts(prev => {
              if (prev.find(p => p.id === data.id)) return prev
              return data.is_pinned ? [data, ...prev] : (() => {
                const first = prev.findIndex(p => !p.is_pinned)
                if (first === -1) return [...prev, data]
                return [...prev.slice(0, first), data, ...prev.slice(first)]
              })()
            })
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── DM Realtime — watch for new messages across all threads ─────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dm-unread-realtime')
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'dm_messages' },
        (payload: any) => {
          const msg = payload.new
          if (msg.sender_id === currentUser.id) return // our own message
          setUnreadCounts(prev => ({ ...prev, [msg.thread_id]: (prev[msg.thread_id] ?? 0) + 1 }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUser.id])

  // ── Reactions handler ───────────────────────────────────────────────────────
  function handleReactionsChange(postId: string, updated: Reaction[]) {
    setReactions(prev => [...prev.filter(r => r.post_id !== postId), ...updated])
  }

  // ── Delete post ─────────────────────────────────────────────────────────────
  async function handleDeletePost(postId: string) {
    if (!window.confirm('Delete this post? Agents will no longer see it.')) return
    setDeletingPostId(postId)
    const res = await fetch('/api/admin/messages/delete-post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    setDeletingPostId(null)
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // ── Start thread ────────────────────────────────────────────────────────────
  async function handleStartThread(agentId: string) {
    setStartingThread(true)
    const res = await fetch('/api/admin/messages/start-thread', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    })
    const json = await res.json()
    setStartingThread(false)
    setShowNewMessage(false)
    if (json.threadId) router.push(`/admin/messages/${json.threadId}`)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-white flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-brand">Messages</h1>
        </div>
        <div className="flex gap-2">
          {activeTab === 'board' && (
            <button
              onClick={() => setShowBroadcast(true)}
              className="px-4 py-2.5 bg-success text-white rounded-xl font-semibold text-sm hover:bg-success/90 transition-colors"
            >
              + New Broadcast
            </button>
          )}
          {activeTab === 'direct' && (
            <button
              onClick={() => setShowNewMessage(true)}
              className="px-4 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors"
            >
              + New Message
            </button>
          )}
        </div>

      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'board' ? 'bg-white shadow-sm border border-line text-ink' : 'text-muted-brand hover:text-ink'
          }`}
        >
          📢 Team Board
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'direct' ? 'bg-white shadow-sm border border-line text-ink' : 'text-muted-brand hover:text-ink'
          }`}
        >
          💬 Direct
          {directUnread > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {directUnread > 9 ? '9+' : directUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('agent-chats')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'agent-chats'
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-red-50 text-red-500 hover:bg-red-100'
          }`}
        >
          🔴 Agent Chats
          {agentChatsUnread > 0 && (
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              activeTab === 'agent-chats' ? 'bg-white text-red-500' : 'bg-red-500 text-white'
            }`}>
              {agentChatsUnread > 9 ? '9+' : agentChatsUnread}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* ── Board ─────────────────────────────────────────────────────────── */}
        {activeTab === 'board' && (
          <div className="max-w-2xl space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-line p-12 text-center">
                <p className="text-3xl mb-3">📢</p>
                <p className="text-sm font-semibold text-ink">No posts yet</p>
                <p className="text-xs text-muted-brand mt-1">Click &quot;+ New Broadcast&quot; to post to all agents.</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} className="relative group">
                <BoardPostCard
                  post={post}
                  reactions={reactions.filter(r => r.post_id === post.id)}
                  currentUserId={currentUser.id}
                  onReactionsChange={handleReactionsChange}
                />
                {/* Delete button overlay */}
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={deletingPostId === post.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
                >
                  {deletingPostId === post.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Direct ────────────────────────────────────────────────────────── */}
        {activeTab === 'direct' && (
          <div className="max-w-xl space-y-2">
            {directThreads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-line p-12 text-center">
                <p className="text-3xl mb-3">💬</p>
                <p className="text-sm font-semibold text-ink">No threads yet</p>
                <p className="text-xs text-muted-brand mt-1">Click &quot;+ New Message&quot; to start a conversation.</p>
              </div>
            ) : directThreads.map(thread => {
              const otherUser = thread.supervisor_id === currentUser.id ? thread.agent : thread.supervisor
              const unread    = unreadCounts[thread.id] ?? 0
              const timestamp = thread.last_message_at ?? thread.created_at
              return (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/admin/messages/${thread.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-line px-4 py-3.5 hover:bg-cream/40 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{initials(otherUser.full_name)}</span>
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink truncate">{otherUser.full_name}</p>
                      <p className="text-[11px] text-muted-brand flex-shrink-0">{timeAgo(timestamp)}</p>
                    </div>
                    <p className="text-[11px] text-muted-brand">{roleLabel(otherUser.role)}</p>
                  </div>
                  {unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Agent Chats ───────────────────────────────────────────────────── */}
        {activeTab === 'agent-chats' && (
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-red-500 text-lg">🔴</span>
              <p className="text-xs text-red-600 font-medium">
                Private conversations between agents — visible only to admins.
              </p>
            </div>

            {agentToAgentThreads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-line p-12 text-center">
                <p className="text-3xl mb-3">🔴</p>
                <p className="text-sm font-semibold text-ink">No agent-to-agent chats yet</p>
                <p className="text-xs text-muted-brand mt-1">When agents message each other, threads appear here.</p>
              </div>
            ) : agentToAgentThreads.map(thread => {
              const unread    = unreadCounts[thread.id] ?? 0
              const timestamp = thread.last_message_at ?? thread.created_at
              return (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/admin/messages/${thread.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-red-100 px-4 py-3.5 hover:bg-red-50/50 transition-colors text-left"
                >
                  {/* Double avatar */}
                  <div className="relative flex-shrink-0 w-11 h-11">
                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center border-2 border-white z-10">
                      <span className="text-[10px] font-bold text-white">{initials(thread.agent.full_name)}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-white">
                      <span className="text-[10px] font-bold text-white">{initials(thread.supervisor.full_name)}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink truncate">
                        {thread.agent.full_name} ↔ {thread.supervisor.full_name}
                      </p>
                      <p className="text-[11px] text-muted-brand flex-shrink-0">{timeAgo(timestamp)}</p>
                    </div>
                    <p className="text-[11px] text-red-400 font-medium">Private messages between agents</p>
                  </div>

                  {unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onPosted={post => {
            setPosts(prev => post.is_pinned
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

      {showNewMessage && (
        <NewMessageModal
          agents={agents}
          onClose={() => setShowNewMessage(false)}
          onSelect={handleStartThread}
          loading={startingThread}
        />
      )}
    </div>
  )
}
