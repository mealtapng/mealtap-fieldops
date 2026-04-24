import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

function adminDb() {
  return createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getContentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const role = user.user_metadata?.role as string
  if (role !== 'admin' && role !== 'content_manager') return null
  return user
}

// POST /api/content/board/reactions — toggle a reaction
export async function POST(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const { post_id, emoji } = body
  if (!post_id || !emoji) return err('post_id and emoji are required', 400)

  const admin = adminDb()

  // Toggle: if exists, delete it; otherwise insert
  const { data: existing } = await (admin as any)
    .from('content_board_reactions')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await (admin as any).from('content_board_reactions').delete().eq('id', existing.id)
  } else {
    await (admin as any)
      .from('content_board_reactions')
      .insert({ post_id, user_id: user.id, emoji })
  }

  const { data: reactions } = await (admin as any)
    .from('content_board_reactions')
    .select('*')
    .eq('post_id', post_id)

  return NextResponse.json({ reactions: reactions ?? [] })
}
