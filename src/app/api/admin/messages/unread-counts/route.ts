import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch all unread messages not sent by the current admin user
  const { data: rows } = await (admin as any)
    .from('dm_messages')
    .select('thread_id')
    .is('read_at', null)
    .neq('sender_id', user.id)

  const counts: Record<string, number> = {}
  for (const row of (rows ?? [])) {
    counts[row.thread_id] = (counts[row.thread_id] ?? 0) + 1
  }

  return NextResponse.json({ counts })
}
