'use client'

import { timeAgo } from '@/lib/format'

interface Props {
  body:             string
  sentAt:           string
  isMine:           boolean
  otherInitials:    string
  senderInitials?:  string  // overrides otherInitials when provided (e.g. admin viewing agent-to-agent)
  attachmentUrl?:   string | null
  attachmentName?:  string | null
}

function Initials({ text }: { text: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}>
      <span className="text-[10px] font-bold text-white">{text}</span>
    </div>
  )
}

function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
}

function AttachmentBlock({ url, name, isMine }: { url: string; name: string; isMine: boolean }) {
  if (isImage(name)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          className="max-w-[220px] rounded-xl border border-white/20 object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 ${
        isMine ? 'bg-white/15 text-white' : 'bg-white/60 border border-green-200 text-ink'
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span className="truncate max-w-[160px]">{name}</span>
      <svg className="w-3.5 h-3.5 flex-shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </a>
  )
}

export function ChatBubble({ body, sentAt, isMine, otherInitials, senderInitials, attachmentUrl, attachmentName }: Props) {
  const avatarText = senderInitials ?? otherInitials
  if (isMine) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[70%] min-w-0" style={{ marginRight: 2 }}>
          <div className="text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words" style={{ background: '#1B5E20' }}>
            {body}
            {attachmentUrl && attachmentName && (
              <AttachmentBlock url={attachmentUrl} name={attachmentName} isMine />
            )}
          </div>
          <p className="text-[10px] text-muted-brand mt-0.5 text-right pr-1">
            {timeAgo(sentAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-2">
      <Initials text={avatarText} />
      <div className="max-w-[70%] min-w-0">
        <div className="text-ink px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm break-words" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          {body}
          {attachmentUrl && attachmentName && (
            <AttachmentBlock url={attachmentUrl} name={attachmentName} isMine={false} />
          )}
        </div>
        <p className="text-[10px] text-muted-brand mt-0.5 pl-1">
          {timeAgo(sentAt)}
        </p>
      </div>
    </div>
  )
}
