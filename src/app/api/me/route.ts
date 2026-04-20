import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** GET /api/me — returns current session user's id, role, and full_name */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data } = await (supabase as any)
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data ?? { error: 'User not found' })
}
