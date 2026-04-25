import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role as string | undefined
  if (!role || !['admin', 'field_lead'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: restaurants, error } = await (supabase as any)
    .from('restaurants')
    .select('id, name, owner_name, owner_phone, address, lat, lng, cuisine_type, avg_meal_price_naira, currently_delivers, delivery_method, has_smartphone, has_bank_account, has_pos, owner_reaction, tag, notes, captured_by, zone_id, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agentIds = Array.from(new Set((restaurants ?? []).map((r: any) => r.captured_by).filter(Boolean)))
  const zoneIds  = Array.from(new Set((restaurants ?? []).map((r: any) => r.zone_id).filter(Boolean)))

  const [usersResult, zonesResult] = await Promise.all([
    agentIds.length > 0
      ? (supabase as any).from('users').select('id, full_name').in('id', agentIds)
      : Promise.resolve({ data: [] }),
    zoneIds.length > 0
      ? (supabase as any).from('zones').select('id, name').in('id', zoneIds)
      : Promise.resolve({ data: [] }),
  ])

  const userMap: Record<string, string> = {}
  for (const u of (usersResult.data ?? [])) userMap[u.id] = u.full_name

  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  function escapeCsv(val: unknown): string {
    if (val == null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = ['id', 'name', 'owner_name', 'owner_phone', 'address', 'lat', 'lng', 'cuisine_type', 'avg_meal_price_naira', 'currently_delivers', 'delivery_method', 'has_smartphone', 'has_bank_account', 'has_pos', 'owner_reaction', 'tag', 'notes', 'agent_name', 'zone_name', 'created_at']

  const rows = (restaurants ?? []).map((r: any) => [
    r.id, r.name, r.owner_name, r.owner_phone, r.address, r.lat, r.lng,
    r.cuisine_type, r.avg_meal_price_naira, r.currently_delivers, r.delivery_method,
    r.has_smartphone, r.has_bank_account, r.has_pos, r.owner_reaction, r.tag, r.notes,
    userMap[r.captured_by] ?? '',
    r.zone_id ? (zoneMap[r.zone_id] ?? '') : '',
    r.created_at,
  ].map(escapeCsv).join(','))

  const csv  = [headers.join(','), ...rows].join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mealtap-restaurants-${date}.csv"`,
    },
  })
}
