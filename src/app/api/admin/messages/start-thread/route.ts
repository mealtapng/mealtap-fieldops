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

  let body: { agentId?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const agentId = typeof body.agentId === 'string' ? body.agentId : null
  if (!agentId) return err('agentId is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check for existing thread (agent=agentId, supervisor=admin)
  const { data: existing } = await (admin as any)
    .from('dm_threads')
    .select('id')
    .eq('agent_id', agentId)
    .eq('supervisor_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ threadId: existing.id })

  const { data: created, error } = await (admin as any)
    .from('dm_threads')
    .insert({ agent_id: agentId, supervisor_id: user.id })
    .select('id')
    .single()

  if (error) {
    console.error('[start-thread]', error.message)
    return err('Failed to create thread', 500)
  }

  return NextResponse.json({ threadId: created.id }, { status: 201 })
}
