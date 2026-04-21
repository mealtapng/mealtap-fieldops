import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  const threadId = request.nextUrl.searchParams.get('threadId')
  if (!threadId) return err('threadId is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify the user is actually a participant before returning data
  const { data: thread } = await (admin as any)
    .from('dm_threads')
    .select('id, agent_id, supervisor_id, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
    .eq('id', threadId)
    .or(`agent_id.eq.${user.id},supervisor_id.eq.${user.id}`)
    .maybeSingle()

  if (!thread) return err('Thread not found', 404)

  const { data: messages } = await (admin as any)
    .from('dm_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('sent_at', { ascending: true })

  return NextResponse.json({ thread, messages: messages ?? [] })
}
