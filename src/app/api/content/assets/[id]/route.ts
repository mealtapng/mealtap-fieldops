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

// GET /api/content/assets/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_assets')
    .select('*, week:content_weeks(id, title, start_date, end_date, week_number), uploader:users!uploaded_by(id, full_name), poster:users!posted_by(id, full_name)')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) return err('Asset not found', 404)
  return NextResponse.json({ asset: data })
}

// PATCH /api/content/assets/[id] — update status, captions, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const VALID_STATUSES = ['uploaded', 'reviewed', 'approved', 'posted']
  const allowed = [
    'title', 'description', 'day_of_week', 'status',
    'caption_instagram', 'caption_tiktok', 'caption_facebook', 'caption_x', 'caption_linkedin',
    'hashtags', 'thumbnail_url', 'sort_order',
  ]
  const updates: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) updates[k] = body[k]
  }

  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    return err('Invalid status', 400)
  }

  // Auto-set posted_by and posted_at when marking as posted
  if (updates.status === 'posted') {
    updates.posted_by = user.id
    updates.posted_at = new Date().toISOString()
  }
  // Clear posted fields if reverting from posted
  if (updates.status && updates.status !== 'posted') {
    updates.posted_by = null
    updates.posted_at = null
  }

  if (!Object.keys(updates).length) return err('No valid fields to update', 400)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_assets')
    .update(updates)
    .eq('id', params.id)
    .select('*, week:content_weeks(id, title, start_date, end_date, week_number), uploader:users!uploaded_by(id, full_name), poster:users!posted_by(id, full_name)')
    .single()

  if (error) {
    console.error('[content/assets PATCH]', error.message)
    return err('Failed to update asset', 500)
  }

  return NextResponse.json({ asset: data })
}
