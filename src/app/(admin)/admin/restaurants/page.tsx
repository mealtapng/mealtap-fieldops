import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RestaurantsTable } from '@/components/admin/RestaurantsTable'

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows, count } = await (supabase as any)
    .from('restaurants')
    .select(`
      id,
      name,
      owner_name,
      owner_phone,
      cuisine_type,
      tag,
      avg_meal_price_naira,
      created_at,
      zones!restaurants_zone_id_fkey ( name ),
      users!restaurants_captured_by_fkey ( full_name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  const restaurants = (rows ?? []).map((r: any) => ({
    id:                   r.id,
    name:                 r.name,
    owner_name:           r.owner_name,
    owner_phone:          r.owner_phone,
    cuisine_type:         r.cuisine_type ?? null,
    zone_name:            r.zones?.name ?? null,
    agent_name:           r.users?.full_name ?? 'Unknown',
    tag:                  r.tag,
    avg_meal_price_naira: r.avg_meal_price_naira ?? null,
    created_at:           r.created_at,
  }))

  return <RestaurantsTable restaurants={restaurants} total={count ?? 0} />
}
