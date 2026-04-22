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

  let body: { body?: unknown; isPinned?: unknown }
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const text     = typeof body.body     === 'string'  ? body.body.trim()  : ''
  const isPinned = typeof body.isPinned === 'boolean' ? body.isPinned     : false

  if (!text) return err('Post body is required', 400)
  if (text.length > 2000) return err('Post too long', 400)

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // title is NOT NULL in the original schema — derive it from the first line
  const title = text.split('\n')[0].slice(0, 120)

  const { data: post, error } = await (admin as any)
    .from('board_posts')
    .insert({ posted_by: user.id, title, body: text, is_pinned: isPinned, post_type: 'announcement' })
    .select('*, author:users!posted_by(id, full_name, role)')
    .single()

  if (error) {
    console.error('[broadcast]', error.message)
    return err('Failed to post', 500)
  }

  return NextResponse.json({ post }, { status: 201 })
}
