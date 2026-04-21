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

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return err('Invalid body', 400) }

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const allowed = ['commission_per_conversion', 'payout_cycle', 'target_weekly_onboardings']
  const updates = allowed
    .filter(k => k in body && body[k] !== undefined && body[k] !== null)
    .map(k => ({ key: k, value: String(body[k]) }))

  if (updates.length === 0) return err('No valid settings provided', 400)

  for (const { key, value } of updates) {
    const { error } = await (admin as any)
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      console.error('[settings/update]', error.message)
      return err('Failed to save settings', 500)
    }
  }

  return NextResponse.json({ ok: true })
}
