import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'

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
  if (!threadId) return NextResponse.json({ error: 'threadId is required' }, { status: 400 })

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify current user is a party to this thread
  const { data: thread } = await (admin as any)
    .from('dm_threads')
    .select('id')
    .eq('id', threadId)
    .or(`agent_id.eq.${user.id},supervisor_id.eq.${user.id}`)
    .maybeSingle()

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  await (admin as any)
    .from('dm_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ ok: true })
}
