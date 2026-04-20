import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/onboard/submit
 *
 * Body:
 *   step1: { lat, lng, accuracy, address, lockedAt }
 *   step2: { userPhone, userName, meterNumber, discoArea }
 *   step3: { checklistSavedNumber, checklistSentHi, checklistEnteredCode,
 *             checklistPurchasedToken, tokenAmountPurchased }
 *   step4: { conversionStatus, notes }
 *
 * Returns: { onboardingId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { step1, step2, step3, step4 } = body

  if (!step1 || !step2 || !step4) {
    return NextResponse.json({ error: 'Missing step data' }, { status: 400 })
  }
  if (!step2.userPhone?.trim()) {
    return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 })
  }
  if (!step2.userName?.trim()) {
    return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
  }
  if (!step2.discoArea?.trim()) {
    return NextResponse.json({ error: 'DISCO area is required' }, { status: 400 })
  }
  if (!step4.conversionStatus) {
    return NextResponse.json({ error: 'Conversion status is required' }, { status: 400 })
  }

  // Fetch agent's assigned zone + referral code
  const { data: agentRow } = await (supabase as any)
    .from('users')
    .select('assigned_zone_id, referral_code')
    .eq('id', user.id)
    .single()

  const zoneId: string | null      = agentRow?.assigned_zone_id ?? null
  const referralCode: string        = agentRow?.referral_code ?? ''

  // Derive conversion_status from checklist if all 4 steps done
  const allChecked =
    step3?.checklistSavedNumber &&
    step3?.checklistSentHi &&
    step3?.checklistEnteredCode &&
    step3?.checklistPurchasedToken

  const conversionStatus = allChecked ? 'converted' : step4.conversionStatus

  // INSERT onboarding row
  const { data: onboarding, error: insertError } = await (supabase as any)
    .from('onboardings')
    .insert({
      user_phone:                step2.userPhone.trim(),
      user_name:                 step2.userName.trim(),
      meter_number:              step2.meterNumber?.trim() || null,
      disco_area:                step2.discoArea.trim(),
      lat:                       step1.lat,
      lng:                       step1.lng,
      gps_accuracy_m:            step1.accuracy,
      location:                  `SRID=4326;POINT(${step1.lng} ${step1.lat})`,
      address:                   step1.address || null,
      referral_code:             referralCode,
      conversion_status:         conversionStatus,
      checklist_saved_number:    step3?.checklistSavedNumber    ?? false,
      checklist_sent_hi:         step3?.checklistSentHi         ?? false,
      checklist_entered_code:    step3?.checklistEnteredCode    ?? false,
      checklist_purchased_token: step3?.checklistPurchasedToken ?? false,
      token_amount_purchased:    step3?.tokenAmountPurchased    ?? null,
      agent_id:                  user.id,
      zone_id:                   zoneId,
      notes:                     step4.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[onboard/submit] insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ onboardingId: onboarding.id })
}
