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

// GET /api/content/weeks — list all weeks with asset counts
export async function GET() {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_weeks')
    .select('*, assets:content_assets(id)')
    .order('start_date', { ascending: false })

  if (error) return err('Failed to fetch weeks', 500)

  const weeks = (data ?? []).map((w: any) => ({
    ...w,
    asset_count: w.assets?.length ?? 0,
    assets: undefined,
  }))

  return NextResponse.json({ weeks })
}

// POST /api/content/weeks — create a new week (admin only)
export async function POST(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const { title, week_number, start_date, end_date, general_instructions, status } = body
  if (!title?.trim()) return err('title is required', 400)
  if (!start_date)    return err('start_date is required', 400)
  if (!end_date)      return err('end_date is required', 400)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_weeks')
    .insert({
      title:                title.trim(),
      week_number:          week_number ?? 1,
      start_date,
      end_date,
      general_instructions: general_instructions?.trim() ?? null,
      status:               status ?? 'draft',
      created_by:           user.id,
    })
    .select('*, assets:content_assets(id)')
    .single()

  if (error) {
    console.error('[content/weeks POST]', error.message)
    return err('Failed to create week', 500)
  }

  return NextResponse.json({ week: { ...data, asset_count: 0, assets: undefined } }, { status: 201 })
}

// PATCH /api/content/weeks?id= — update week status (admin only)
export async function PATCH(request: NextRequest) {
  const user = await getContentUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return err('id is required', 400)

  let body: any
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const allowed = ['title', 'general_instructions', 'status', 'week_number', 'start_date', 'end_date']
  const updates: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) updates[k] = body[k]
  }
  if (!Object.keys(updates).length) return err('No valid fields to update', 400)

  const admin = adminDb()
  const { data, error } = await (admin as any)
    .from('content_weeks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return err('Failed to update week', 500)
  return NextResponse.json({ week: data })
}
