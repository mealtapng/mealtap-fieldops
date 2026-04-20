'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChatBubble } from '@/components/agent/ChatBubble'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:              string
  thread_id:       string
  sender_id:       string
  body:            string
  sent_at:         string
  read_at:         string | null
  attachment_url:  string | null
  attachment_name: string | null
}

interface OtherUser {
  id:        string
  full_name: string
  role:      string
}

// ── Helper ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Page (client component — handles auth + data itself) ──────────────────────

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router       = useRouter()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser,     setOtherUser]     = useState<OtherUser | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setCurrentUserId(user.id)

      // Fetch thread to verify access and get other user
      const { data: thread } = await supabase
        .from('dm_threads' as any)
        .select('id, agent_id, supervisor_id, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
        .eq('id', threadId)
        .or(`agent_id.eq.${user.id},supervisor_id.eq.${user.id}`)
        .maybeSingle()

      if (!thread) { router.push('/messages'); return }

      const other = (thread as any).agent_id === user.id
        ? (thread as any).supervisor
        : (thread as any).agent
      setOtherUser(other)

      // Fetch messages
      const { data: msgs } = await supabase
        .from('dm_messages' as any)
        .select('*')
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true })

      setMessages((msgs ?? []) as Message[])
      setLoading(false)

      // Mark messages as read (non-blocking)
      fetch('/api/messages/mark-read', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ threadId }),
      }).catch(() => {})
    }

    load()
  }, [threadId, router])

  // ── Realtime subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`dm-thread-${threadId}`)
      .on(
        'postgres_changes' as any,
        {
          event:  'INSERT',
          schema: 'public',
          table:  'dm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: any) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
          // Mark read if message is from the other person
          if (payload.new.sender_id !== currentUserId) {
            fetch('/api/messages/mark-read', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ threadId }),
            }).catch(() => {})
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [threadId, currentUserId])

  // ── Auto-scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ─────────────────────────────────────────────────────────────
  async function send(attachmentUrl?: string, attachmentName?: string) {
    const body = input.trim()
    if (!body && !attachmentUrl) return
    if (sending || !currentUserId) return

    setSending(true)
    setInput('')
    inputRef.current?.focus()

    const supabase = supabaseRef.current

    const { data: inserted } = await (supabase as any)
      .from('dm_messages')
      .insert({
        thread_id:       threadId,
        sender_id:       currentUserId,
        body:            body,
        attachment_url:  attachmentUrl  ?? null,
        attachment_name: attachmentName ?? null,
      })
      .select('*')
      .single()

    // Show own message immediately without waiting for Realtime
    if (inserted) {
      setMessages(prev => {
        if (prev.find((m: Message) => m.id === inserted.id)) return prev
        return [...prev, inserted as Message]
      })
    }

    // Update thread's last_message_at
    await (supabase as any)
      .from('dm_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId)

    setSending(false)
  }

  // ── File attachment ───────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const MAX = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX) { alert('File must be under 10 MB.'); return }

    setUploadingFile(true)
    const supabase = supabaseRef.current
    const ext  = file.name.split('.').pop()
    const path = `${threadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('dm-attachments')
      .upload(path, file, { upsert: false })

    if (error) {
      alert('Upload failed. Please try again.')
      setUploadingFile(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dm-attachments')
      .getPublicUrl(path)

    setUploadingFile(false)
    await send(publicUrl, file.name)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-cream border-b border-line flex-shrink-0">
          <Link
            href="/messages"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-line text-muted-brand active:bg-cream"
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
                <p className="text-[11px] text-muted-brand">
                  {otherUser.role === 'admin' ? 'Admin' : otherUser.role === 'field_lead' ? 'Field Lead' : 'Agent'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Message list ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full py-20">
              <p className="text-sm text-muted-brand text-center">
                No messages yet. Say hello!
              </p>
            </div>
          )}
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              body={msg.body}
              sentAt={msg.sent_at}
              isMine={msg.sender_id === currentUserId}
              otherInitials={otherUser ? initials(otherUser.full_name) : '?'}
              attachmentUrl={msg.attachment_url}
              attachmentName={msg.attachment_name}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ───────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-line bg-cream px-4 py-3 flex items-end gap-2">

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Paperclip button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={sending || uploadingFile}
            title="Attach image or PDF"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-muted-brand hover:text-ink hover:bg-white active:bg-cream transition-colors disabled:opacity-40"
          >
            {uploadingFile ? (
              <div className="w-4 h-4 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            )}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 1000))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            style={{ resize: 'none' }}
            className="flex-1 rounded-2xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra bg-white overflow-hidden"
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !sending
                ? 'bg-terra text-white shadow-md shadow-terra/25 active:bg-terra-dark'
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
