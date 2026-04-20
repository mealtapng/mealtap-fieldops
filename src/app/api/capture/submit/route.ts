import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/capture/submit
 *
 * Body:
 *   step1: { lat, lng, accuracy, address, lockedAt }
 *   step2: { name, ownerName, ownerPhone, cuisineType, avgPrice,
 *             dailyOrderVolume, currentlyDelivers, deliveryMethods,
 *             hasSmartphone, hasBankAccount, hasPOS }
 *   step4: { ownerReaction, tag, notes }
 *   photos: { storefront: string|null, menu: string|null, dish: string|null }
 *             (storage paths already uploaded by the client)
 *
 * Returns: { restaurantId: string }
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

  const { step1, step2, step4, photos } = body

  if (!step1 || !step2 || !step4) {
    return NextResponse.json({ error: 'Missing step data' }, { status: 400 })
  }
  if (!step2.name?.trim()) {
    return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 })
  }

  // Fetch the agent's assigned zone so we can store it on the restaurant
  const { data: agentRow } = await (supabase as any)
    .from('users')
    .select('assigned_zone_id')
    .eq('id', user.id)
    .single()

  const zoneId: string | null = agentRow?.assigned_zone_id ?? null

  // Map multi-select delivery methods → primary enum value for legacy column
  const deliveryMethods: string[] = Array.isArray(step2.deliveryMethods)
    ? step2.deliveryMethods
    : []
  const primaryDeliveryMethod =
    step2.currentlyDelivers && deliveryMethods.length > 0
      ? deliveryMethods[0]
      : 'none'

  // INSERT restaurant row
  const { data: restaurant, error: insertError } = await (supabase as any)
    .from('restaurants')
    .insert({
      name:                        step2.name.trim(),
      owner_name:                  step2.ownerName?.trim() || null,
      owner_phone:                 step2.ownerPhone?.trim() || null,
      address:                     step1.address || null,
      lat:                         step1.lat,
      lng:                         step1.lng,
      gps_accuracy_m:              step1.accuracy,
      location:                    `SRID=4326;POINT(${step1.lng} ${step1.lat})`,
      cuisine_type:                step2.cuisineType?.trim() || null,
      avg_meal_price_naira:        step2.avgPrice ?? null,
      daily_order_volume_estimate: step2.dailyOrderVolume ?? null,
      currently_delivers:          step2.currentlyDelivers ?? null,
      delivery_method:             primaryDeliveryMethod,
      delivery_methods:            deliveryMethods,
      has_smartphone:              step2.hasSmartphone ?? null,
      has_bank_account:            step2.hasBankAccount ?? null,
      has_pos:                     step2.hasPOS ?? null,
      owner_reaction:              step4.ownerReaction ?? null,
      tag:                         step4.tag ?? null,
      notes:                       step4.notes?.trim() || null,
      captured_by:                 user.id,
      zone_id:                     zoneId,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[capture/submit] restaurant insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const restaurantId: string = restaurant.id

  // INSERT restaurant_photos rows for each uploaded photo
  const photoEntries: { restaurant_id: string; photo_url: string; photo_type: string; uploaded_by: string }[] = []

  if (photos?.storefront) {
    photoEntries.push({ restaurant_id: restaurantId, photo_url: photos.storefront, photo_type: 'storefront', uploaded_by: user.id })
  }
  if (photos?.menu) {
    photoEntries.push({ restaurant_id: restaurantId, photo_url: photos.menu, photo_type: 'menu', uploaded_by: user.id })
  }
  if (photos?.dish) {
    photoEntries.push({ restaurant_id: restaurantId, photo_url: photos.dish, photo_type: 'dish', uploaded_by: user.id })
  }

  if (photoEntries.length > 0) {
    const { error: photoError } = await (supabase as any)
      .from('restaurant_photos')
      .insert(photoEntries)

    if (photoError) {
      // Non-fatal: restaurant is saved, photos just didn't link
      console.error('[capture/submit] photo insert error:', photoError)
    }
  }

  return NextResponse.json({ restaurantId })
}
