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
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  let body: { threadId?: unknown; message?: unknown; attachmentUrl?: unknown; attachmentName?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const threadId      = typeof body.threadId      === 'string' ? body.threadId.trim()      : null
  const message       = typeof body.message       === 'string' ? body.message.trim()       : ''
  const attachmentUrl  = typeof body.attachmentUrl  === 'string' ? body.attachmentUrl.trim()  : null
  const attachmentName = typeof body.attachmentName === 'string' ? body.attachmentName.trim() : null
  if (!threadId) return err('threadId is required', 400)
  if (!message && !attachmentUrl) return err('message or attachment is required', 400)
  if (message.length > 1000) return err('Message too long', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date().toISOString()

  const insertRow: Record<string, unknown> = {
    thread_id: threadId,
    sender_id: user.id,
    body:      message,
  }
  if (attachmentUrl)  insertRow.attachment_url  = attachmentUrl
  if (attachmentName) insertRow.attachment_name = attachmentName

  const { data: inserted, error: msgError } = await (admin as any)
    .from('dm_messages')
    .insert(insertRow)
    .select('*')
    .single()

  if (msgError) {
    console.error('[admin/send]', msgError.message)
    return err('Failed to send message', 500)
  }

  // Update last_message_at on the thread
  await (admin as any)
    .from('dm_threads')
    .update({ last_message_at: now })
    .eq('id', threadId)

  return NextResponse.json({ ok: true, message: inserted })
}
