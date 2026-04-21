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
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  const threadId = request.nextUrl.searchParams.get('threadId')
  if (!threadId) return err('threadId is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const [threadResult, messagesResult] = await Promise.all([
    (admin as any)
      .from('dm_threads')
      .select('id, agent_id, supervisor_id, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
      .eq('id', threadId)
      .maybeSingle(),
    (admin as any)
      .from('dm_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('sent_at', { ascending: true }),
  ])

  return NextResponse.json({
    thread:   threadResult.data  ?? null,
    messages: messagesResult.data ?? [],
  })
}
