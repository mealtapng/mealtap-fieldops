'use client'

import { timeAgo } from '@/lib/format'

interface Props {
  body:          string
  sentAt:        string
  isMine:        boolean
  otherInitials: string
}

function Initials({ text }: { text: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest to-terra flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-white">{text}</span>
    </div>
  )
}

export function ChatBubble({ body, sentAt, isMine, otherInitials }: Props) {
  if (isMine) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[80%]">
          <div className="bg-terra text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {body}
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
      <Initials text={otherInitials} />
      <div className="max-w-[80%]">
        <div className="bg-white text-ink px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
          {body}
        </div>
        <p className="text-[10px] text-muted-brand mt-0.5 pl-1">
          {timeAgo(sentAt)}
        </p>
      </div>
    </div>
  )
}
