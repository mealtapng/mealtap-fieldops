'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChatBubble } from '@/components/agent/ChatBubble'

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

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function AdminThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router       = useRouter()

  const [currentUserId,   setCurrentUserId]   = useState<string | null>(null)
  const [otherUser,       setOtherUser]       = useState<OtherUser | null>(null)
  const [participantMap,  setParticipantMap]  = useState<Record<string, string>>({}) // sender_id → initials
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())

  // ── Load thread + messages via API (bypasses RLS) ──────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const res = await fetch(`/api/admin/messages/fetch?threadId=${threadId}`)
      if (!res.ok) { router.push('/admin/messages'); return }
      const data = await res.json()

      const thread = data.thread
      if (!thread) { router.push('/admin/messages'); return }

      const other = thread.supervisor_id === user.id ? thread.agent : thread.supervisor
      setOtherUser(other)

      // Build initials map for both participants (used when admin observes agent-to-agent)
      const pMap: Record<string, string> = {}
      if (thread.agent)      pMap[thread.agent_id]      = initials(thread.agent.full_name)
      if (thread.supervisor) pMap[thread.supervisor_id] = initials(thread.supervisor.full_name)
      setParticipantMap(pMap)
      setMessages(data.messages ?? [])
      setLoading(false)

      fetch('/api/messages/mark-read', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      }).catch(() => {})
    }

    load()
  }, [threadId, router])

  // ── Polling (catches messages every 4 s) ───────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/messages/fetch?threadId=${threadId}`)
      if (!res.ok) return
      const data = await res.json()
      const fetched: Message[] = data.messages ?? []
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newMsgs = fetched.filter(m => !existingIds.has(m.id))
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [threadId, currentUserId])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send ────────────────────────────────────────────────────────────────────
  async function send(attachmentUrl?: string, attachmentName?: string) {
    const body = input.trim()
    if (!body && !attachmentUrl) return
    if (sending || !currentUserId) return

    setSending(true)
    setInput('')
    inputRef.current?.focus()

    const res = await fetch('/api/admin/messages/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, message: body, attachmentUrl, attachmentName }),
    })

    const data = await res.json()
    if (data.message) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.message.id)) return prev
        return [...prev, data.message as Message]
      })
    }

    setSending(false)
  }

  // ── File attachment ──────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const MAX = 10 * 1024 * 1024
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-success/30 border-t-success rounded-full animate-spin" />
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
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
              senderInitials={participantMap[msg.sender_id]}
              attachmentUrl={msg.attachment_url}
              attachmentName={msg.attachment_name}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-line bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-end gap-2">

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={sending || uploadingFile}
            title="Attach image or PDF"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-muted-brand hover:text-ink hover:bg-cream transition-colors disabled:opacity-40"
          >
            {uploadingFile ? (
              <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
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
            className="flex-1 rounded-2xl border border-line px-4 py-2.5 text-sm text-ink placeholder:text-muted-brand/60 focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success bg-cream/40 overflow-hidden"
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
                ? 'bg-success text-white shadow-md shadow-success/25 hover:bg-success/90'
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
