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
  try {
    body = await request.json()
  } catch {
    return err('Invalid request body', 400)
  }

  const agentId = typeof body.agentId === 'string' ? body.agentId : null
  if (!agentId) return err('agentId is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await (admin as any)
    .from('users')
    .update({ is_active: true, failed_attempts: 0 })
    .eq('id', agentId)

  if (error) {
    console.error('[agents/reactivate] update error:', error.message)
    return err('Failed to reactivate agent', 500)
  }

  return NextResponse.json({ success: true })
}
