import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/onboard/submit
 *
 * Body:
 *   step1: { lat, lng, accuracy, address, lockedAt }
 *   step2: { restaurantName, ownerName, ownerPhone, cuisineType, avgMealPriceNaira,
 *            dailyOrderVolumeEstimate, currentlyDelivers, deliveryMethod,
 *            hasSmartphone, hasBankAccount, hasPOS }
 *   step3: { storefrontPath, menuPath, dishPath, ownerPath }  (nullable)
 *   step4: { ownerReaction, tag, notes }
 *
 * Returns: { restaurantId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { step1, step2, step3, step4 } = body as {
    step1?: Record<string, unknown>
    step2?: Record<string, unknown>
    step3?: Record<string, unknown>
    step4?: Record<string, unknown>
  }

  if (!step1 || !step2 || !step4) {
    return NextResponse.json({ error: 'Missing step data' }, { status: 400 })
  }

  const name       = (step2.restaurantName as string)?.trim()
  const ownerName  = (step2.ownerName as string)?.trim()
  const ownerPhone = (step2.ownerPhone as string)?.trim()
  const tag        = step4.tag as string

  if (!name)       return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 })
  if (!ownerName)  return NextResponse.json({ error: 'Owner name is required' }, { status: 400 })
  if (!ownerPhone) return NextResponse.json({ error: 'Owner phone is required' }, { status: 400 })
  if (!tag)        return NextResponse.json({ error: 'Lead tag is required' }, { status: 400 })

  // Fetch agent's assigned zone
  const { data: agentRow } = await supabase
    .from('users')
    .select('assigned_zone_id')
    .eq('id', user.id)
    .single() as { data: { assigned_zone_id: string | null } | null; error: unknown }

  const zoneId = agentRow?.assigned_zone_id ?? null

  // Compute quality score (simple heuristic)
  const photoCount = [step3?.storefrontPath, step3?.menuPath, step3?.dishPath, step3?.ownerPath].filter(Boolean).length
  const qualityScore =
    (name ? 20 : 0) +
    (ownerName ? 20 : 0) +
    (ownerPhone ? 20 : 0) +
    photoCount * 10

  // INSERT restaurant row
  const { data: restaurant, error: insertError } = await (supabase as any)
    .from('restaurants')
    .insert({
      name,
      owner_name:                   ownerName,
      owner_phone:                  ownerPhone,
      address:                      (step1.address as string) || null,
      lat:                          step1.lat as number,
      lng:                          step1.lng as number,
      gps_accuracy_m:               step1.accuracy as number,
      location:                     `SRID=4326;POINT(${step1.lng} ${step1.lat})`,
      cuisine_type:                 (step2.cuisineType as string) || null,
      avg_meal_price_naira:         step2.avgMealPriceNaira ?? null,
      daily_order_volume_estimate:  step2.dailyOrderVolumeEstimate ?? null,
      currently_delivers:           step2.currentlyDelivers ?? false,
      delivery_method:              (step2.deliveryMethod as string) || null,
      has_smartphone:               step2.hasSmartphone ?? false,
      has_bank_account:             step2.hasBankAccount ?? false,
      has_pos:                      step2.hasPOS ?? false,
      owner_reaction:               step4.ownerReaction ?? null,
      tag,
      notes:                        (step4.notes as string)?.trim() || null,
      captured_by:                  user.id,
      zone_id:                      zoneId,
      quality_score:                qualityScore,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[onboard/submit] insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // INSERT photo rows (if any)
  const photoTypes: [string | null | undefined, string][] = [
    [step3?.storefrontPath as string | null, 'storefront'],
    [step3?.menuPath       as string | null, 'menu'],
    [step3?.dishPath       as string | null, 'dish'],
    [step3?.ownerPath      as string | null, 'owner'],
  ]

  const photoRows = photoTypes
    .filter(([path]) => !!path)
    .map(([path, photoType]) => ({
      restaurant_id: (restaurant as { id: string }).id,
      photo_type:    photoType,
      storage_path:  path!,
      uploaded_by:   user.id,
    }))

  if (photoRows.length > 0) {
    const { error: photoError } = await (supabase as any)
      .from('restaurant_photos')
      .insert(photoRows)

    if (photoError) {
      console.error('[onboard/submit] photo insert error:', photoError)
      // Non-fatal — restaurant was saved, photos failed
    }
  }

  return NextResponse.json({ restaurantId: (restaurant as { id: string }).id })
}
