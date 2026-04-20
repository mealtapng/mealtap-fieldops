import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/messages/create-thread
 * Body: { supervisorId: string }
 * Creates a DM thread between the current user (agent) and the given supervisor.
 * Returns: { threadId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let supervisorId: string
  try {
    const body = await request.json()
    supervisorId = typeof body.supervisorId === 'string' ? body.supervisorId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!supervisorId) {
    return NextResponse.json({ error: 'supervisorId is required' }, { status: 400 })
  }

  // Check if thread already exists (unique constraint on agent_id + supervisor_id)
  const { data: existing } = await (supabase as any)
    .from('dm_threads')
    .select('id')
    .eq('agent_id', user.id)
    .eq('supervisor_id', supervisorId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ threadId: existing.id })
  }

  const { data, error } = await (supabase as any)
    .from('dm_threads')
    .insert({ agent_id: user.id, supervisor_id: supervisorId })
    .select('id')
    .single()

  if (error) {
    console.error('[create-thread]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ threadId: data.id })
}
