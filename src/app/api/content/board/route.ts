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

// GET /api/content/board
export async function GET() {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  const admin = adminDb()
  const [postsRes, reactionsRes] = await Promise.all([
    (admin as any)
      .from('content_board_posts')
      .select('*, author:users!author_id(id, full_name, role)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    (admin as any)
      .from('content_board_reactions')
      .select('*'),
  ])

  return NextResponse.json({
    posts:     postsRes.data     ?? [],
    reactions: reactionsRes.data ?? [],
  })
}

// POST /api/content/board — create a post
export async function POST(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const text     = typeof body.body      === 'string'  ? body.body.trim()  : ''
  const isPinned = typeof body.is_pinned === 'boolean' ? body.is_pinned    : false

  if (!text)              return err('body is required', 400)
  if (text.length > 2000) return err('Post too long (max 2000 chars)', 400)

  // Only admins can pin posts
  const canPin = user.user_metadata?.role === 'admin' && isPinned

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_board_posts')
    .insert({ author_id: user.id, body: text, is_pinned: canPin })
    .select('*, author:users!author_id(id, full_name, role)')
    .single()

  if (error) {
    console.error('[content/board POST]', error.message)
    return err('Failed to post', 500)
  }

  return NextResponse.json({ post: data }, { status: 201 })
}

// DELETE /api/content/board?id= — delete a post (author or admin)
export async function DELETE(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return err('id is required', 400)

  const admin = adminDb()
  const { data: post } = await (admin as any)
    .from('content_board_posts')
    .select('author_id')
    .eq('id', id)
    .maybeSingle()

  if (!post) return err('Post not found', 404)
  if (post.author_id !== user.id && user.user_metadata?.role !== 'admin') {
    return err('Forbidden', 403)
  }

  await (admin as any).from('content_board_posts').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
