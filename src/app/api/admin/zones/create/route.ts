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

  let body: { name?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return err('Zone name is required', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: zone, error } = await (admin as any)
    .from('zones')
    .insert({ name })
    .select('id, name, center_lat, center_lng')
    .single()

  if (error) {
    if (error.code === '23505') return err('A zone with this name already exists', 409)
    console.error('[zones/create]', error.message)
    return err('Failed to create zone', 500)
  }

  return NextResponse.json({ zone }, { status: 201 })
}
