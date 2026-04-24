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

const VALID_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const VALID_TYPES = ['image','video','document','graphic']

// GET /api/content/assets?weekId= — all assets for a week
export async function GET(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  const weekId = request.nextUrl.searchParams.get('weekId')
  if (!weekId) return err('weekId is required', 400)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_assets')
    .select('*, uploader:users!uploaded_by(id, full_name), poster:users!posted_by(id, full_name)')
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return err('Failed to fetch assets', 500)
  return NextResponse.json({ assets: data ?? [] })
}

// POST /api/content/assets — save asset metadata after upload
export async function POST(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const {
    week_id, day_of_week, title, description,
    file_url, file_type, thumbnail_url,
    caption_instagram, caption_tiktok, caption_facebook, caption_x, caption_linkedin,
    hashtags, sort_order,
  } = body

  if (!week_id)                         return err('week_id is required', 400)
  if (!VALID_DAYS.includes(day_of_week)) return err('Invalid day_of_week', 400)
  if (!title?.trim())                   return err('title is required', 400)
  if (!file_url?.trim())                return err('file_url is required', 400)
  if (!VALID_TYPES.includes(file_type)) return err('Invalid file_type', 400)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_assets')
    .insert({
      week_id,
      day_of_week,
      title:             title.trim(),
      description:       description?.trim() ?? null,
      file_url:          file_url.trim(),
      file_type,
      thumbnail_url:     thumbnail_url ?? null,
      caption_instagram: caption_instagram?.trim() ?? null,
      caption_tiktok:    caption_tiktok?.trim() ?? null,
      caption_facebook:  caption_facebook?.trim() ?? null,
      caption_x:         caption_x?.trim() ?? null,
      caption_linkedin:  caption_linkedin?.trim() ?? null,
      hashtags:          hashtags?.trim() ?? null,
      sort_order:        sort_order ?? 0,
      uploaded_by:       user.id,
      status:            'uploaded',
    })
    .select('*, uploader:users!uploaded_by(id, full_name)')
    .single()

  if (error) {
    console.error('[content/assets POST]', error.message)
    return err('Failed to save asset', 500)
  }

  return NextResponse.json({ asset: data }, { status: 201 })
}
