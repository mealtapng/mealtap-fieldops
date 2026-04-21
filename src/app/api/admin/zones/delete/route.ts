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

  let body: { id?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return err('Zone id is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await (admin as any).from('zones').delete().eq('id', id)

  if (error) {
    console.error('[zones/delete]', error.message)
    return err('Failed to delete zone', 500)
  }

  return NextResponse.json({ ok: true })
}
