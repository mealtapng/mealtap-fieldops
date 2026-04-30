import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

const ALLOWED_ROLES = ['agent', 'field_lead', 'admin', 'content_manager'] as const
type Role = (typeof ALLOWED_ROLES)[number]

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  let body: { agentId?: unknown; role?: unknown }
  try {
    body = await request.json()
  } catch {
    return err('Invalid request body', 400)
  }

  const agentId = typeof body.agentId === 'string' ? body.agentId : null
  const role    = typeof body.role    === 'string' ? body.role    : null

  if (!agentId) return err('agentId is required', 400)
  if (!role || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
    return err(`role must be one of: ${ALLOWED_ROLES.join(', ')}`, 400)
  }

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const [dbResult, authResult] = await Promise.all([
    (admin as any).from('users').update({ role }).eq('id', agentId),
    admin.auth.admin.updateUserById(agentId, { user_metadata: { role: role as Role } }),
  ])

  if (dbResult.error) {
    console.error('[agents/update-role] db error:', dbResult.error.message)
    return err(dbResult.error.message ?? 'Failed to update role', 500)
  }
  if (authResult.error) {
    console.error('[agents/update-role] auth error:', authResult.error.message)
    return err(authResult.error.message ?? 'Failed to update auth metadata', 500)
  }

  return NextResponse.json({ success: true, role })
}
