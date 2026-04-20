import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/messages/mark-read
 * Body: { threadId: string }
 * Marks all unread messages in the thread (sent by the other party) as read.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let threadId: string
  try {
    const body = await request.json()
    threadId = typeof body.threadId === 'string' ? body.threadId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
  }

  // Verify current user is a party to this thread
  const { data: thread } = await (supabase as any)
    .from('dm_threads')
    .select('id')
    .eq('id', threadId)
    .or(`agent_id.eq.${user.id},supervisor_id.eq.${user.id}`)
    .maybeSingle()

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  await (supabase as any)
    .from('dm_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ ok: true })
}
