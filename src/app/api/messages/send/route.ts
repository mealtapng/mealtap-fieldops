import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  let body: { threadId?: unknown; message?: unknown; attachmentUrl?: unknown; attachmentName?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const threadId       = typeof body.threadId       === 'string' ? body.threadId.trim()       : null
  const message        = typeof body.message        === 'string' ? body.message.trim()        : ''
  const attachmentUrl  = typeof body.attachmentUrl  === 'string' ? body.attachmentUrl.trim()  : null
  const attachmentName = typeof body.attachmentName === 'string' ? body.attachmentName.trim() : null
  if (!threadId) return err('threadId is required', 400)
  if (!message && !attachmentUrl) return err('message or attachment is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify the agent is a participant in this thread
  const { data: thread } = await (admin as any)
    .from('dm_threads')
    .select('id')
    .eq('id', threadId)
    .or(`agent_id.eq.${user.id},supervisor_id.eq.${user.id}`)
    .maybeSingle()

  if (!thread) return err('Thread not found', 404)

  const { data: inserted, error: msgError } = await (admin as any)
    .from('dm_messages')
    .insert({
      thread_id:       threadId,
      sender_id:       user.id,
      body:            message,
      attachment_url:  attachmentUrl  ?? null,
      attachment_name: attachmentName ?? null,
    })
    .select('*')
    .single()

  if (msgError) {
    console.error('[messages/send]', msgError.message)
    return err('Failed to send message', 500)
  }

  await (admin as any)
    .from('dm_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId)

  return NextResponse.json({ ok: true, message: inserted })
}
