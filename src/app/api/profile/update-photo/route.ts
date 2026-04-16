import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/profile/update-photo
 * Body: { path: string }
 *
 * Updates the authenticated user's passport_photo_url using the server-side
 * Supabase client, which carries the session cookie and is RLS-safe.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let path: string
  try {
    const body = await request.json()
    path = typeof body.path === 'string' ? body.path.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!path) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('users')
    .update({ passport_photo_url: path })
    .eq('id', user.id)

  if (error) {
    console.error('[update-photo] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
