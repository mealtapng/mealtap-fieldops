import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { supervisorId?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const otherId = typeof body.supervisorId === 'string' ? body.supervisorId.trim() : ''
  if (!otherId) return NextResponse.json({ error: 'supervisorId is required' }, { status: 400 })

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check for existing thread in either direction
  const { data: existing } = await (admin as any)
    .from('dm_threads')
    .select('id')
    .or(`and(agent_id.eq.${user.id},supervisor_id.eq.${otherId}),and(agent_id.eq.${otherId},supervisor_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) return NextResponse.json({ threadId: existing.id })

  const { data, error } = await (admin as any)
    .from('dm_threads')
    .insert({ agent_id: user.id, supervisor_id: otherId })
    .select('id')
    .single()

  if (error) {
    console.error('[create-thread]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ threadId: data.id })
}
