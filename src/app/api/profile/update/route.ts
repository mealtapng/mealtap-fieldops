import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if ('email' in body)             update.email               = (body.email as string)?.trim() || null
  if ('dateOfBirth' in body)       update.date_of_birth       = (body.dateOfBirth as string) || null
  if ('homeAddress' in body)       update.home_address        = (body.homeAddress as string)?.trim() || null
  if ('ninLast4' in body)          update.nin_last_4          = String(body.ninLast4 ?? '').replace(/\D/g, '').slice(0, 4) || null
  if ('nextOfKinName' in body)     update.next_of_kin_name    = (body.nextOfKinName as string)?.trim() || null
  if ('nextOfKinPhone' in body)    update.next_of_kin_phone   = (body.nextOfKinPhone as string)?.trim() || null
  if ('bankName' in body)          update.bank_name           = (body.bankName as string)?.trim() || null
  if ('bankAccountMasked' in body) update.bank_account_masked = (body.bankAccountMasked as string)?.trim() || null

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await (supabase as any).from('users').update(update).eq('id', user.id)

  if (error) {
    console.error('[profile/update]', error.message)
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
