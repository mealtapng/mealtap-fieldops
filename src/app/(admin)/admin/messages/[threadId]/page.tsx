'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChatBubble } from '@/components/agent/ChatBubble'

interface Message {
  id:        string
  thread_id: string
  sender_id: string
  body:      string
  sent_at:   string
  read_at:   string | null
}

interface OtherUser {
  id:        string
  full_name: string
  role:      string
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function AdminThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router       = useRouter()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser,     setOtherUser]     = useState<OtherUser | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [loading,       setLoading]       = useState(true)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const supabaseRef = useRef(createClient())

  // ── Load thread + messages ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Fetch thread — admin can see any thread (no RLS filter)
      const { data: thread } = await (supabase as any)
        .from('dm_threads')
        .select('id, agent_id, supervisor_id, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
        .eq('id', threadId)
        .maybeSingle()

      if (!thread) { router.push('/admin/messages'); return }

      const other = (thread as any).supervisor_id === user.id
        ? (thread as any).agent
        : (thread as any).supervisor
      setOtherUser(other)

      const { data: msgs } = await (supabase as any)
        .from('dm_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true })

      setMessages((msgs ?? []) as Message[])
      setLoading(false)

      // Mark messages as read
      fetch('/api/messages/mark-read', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      }).catch(() => {})
    }

    load()
  }, [threadId, router])

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`admin-dm-thread-${threadId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT', schema: 'public', table: 'dm_messages',
        filter: `thread_id=eq.${threadId}`,
      }, (payload: any) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
        if (payload.new.sender_id !== currentUserId) {
          fetch('/api/messages/mark-read', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId }),
          }).catch(() => {})
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId, currentUserId])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send ────────────────────────────────────────────────────────────────────
  async function send() {
    const body = input.trim()
    if (!body || sending || !currentUserId) return

    setSending(true)
    setInput('')
    inputRef.current?.focus()

    await fetch('/api/admin/messages/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, message: body }),
    })

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-line flex-shrink-0">
        <Link
          href="/admin/messages"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-line text-muted-brand hover:text-ink hover:border-ink/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        {otherUser && (
          <>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials(otherUser.full_name)}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-ink leading-tight">{otherUser.full_name}</p>
              <p className="text-xs text-muted-brand">
                {otherUser.role === 'admin' ? 'Admin' : otherUser.role === 'field_lead' ? 'Field Lead' : 'Agent'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-cream/40">
        <div className="max-w-2xl mx-auto space-y-0.5">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-brand">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              body={msg.body}
              sentAt={msg.sent_at}
              isMine={msg.sender_id === currentUserId}
              otherInitials={otherUser ? initials(otherUser.full_name) : '?'}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-line bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 1000))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            style={{ resize: 'none' }}
            className="flex-1 rounded-2xl border border-line px-4 py-2.5 text-sm text-ink placeholder:text-muted-brand/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra bg-cream/40 overflow-hidden"
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !sending
                ? 'bg-terra text-white shadow-md shadow-terra/25 hover:bg-terra/90'
                : 'bg-line text-muted-brand'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
