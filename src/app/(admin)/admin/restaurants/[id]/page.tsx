import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

const TAG_LABELS: Record<string, string> = {
  hot:       '🔥 Hot',
  warm:      '✅ Warm',
  cold:      '❄️ Cold',
  not_a_fit: '✕ Not a fit',
}

const TAG_STYLES: Record<string, string> = {
  hot:       'bg-terra-light text-terra',
  warm:      'bg-forest-light text-forest',
  cold:      'bg-line text-muted',
  not_a_fit: 'bg-red-50 text-red-500',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-muted flex-shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-ink text-right flex-1">{value ?? <span className="text-muted">—</span>}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
        {children}
      </div>
    </div>
  )
}

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [restaurantResult, photosResult] = await Promise.all([
    (supabase as any)
      .from('restaurants')
      .select(`
        *,
        zones!restaurants_zone_id_fkey ( name ),
        users!restaurants_captured_by_fkey ( full_name, employee_id )
      `)
      .eq('id', params.id)
      .single(),
    (supabase as any)
      .from('restaurant_photos')
      .select('id, photo_type, storage_path')
      .eq('restaurant_id', params.id),
  ])

  if (restaurantResult.error || !restaurantResult.data) notFound()

  const r       = restaurantResult.data
  const photos: { id: string; photo_type: string; storage_path: string }[] = photosResult.data ?? []

  // Generate signed URLs for photos
  const signedUrls: Record<string, string> = {}
  await Promise.all(
    photos.map(async (p) => {
      const { data } = await (supabase as any).storage
        .from('restaurant-photos')
        .createSignedUrl(p.storage_path, 3600)
      if (data?.signedUrl) signedUrls[p.id] = data.signedUrl
    })
  )

  return (
    <div className="p-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/admin/restaurants"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-forest transition-colors mb-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to restaurants
          </Link>
          <h1 className="text-3xl font-bold text-forest">{r.name}</h1>
          <p className="text-sm text-muted mt-0.5">
            Captured by {r.users?.full_name ?? 'Unknown'} ({r.users?.employee_id ?? '—'}) · {formatDate(r.created_at)}
          </p>
        </div>
        <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${TAG_STYLES[r.tag] ?? 'bg-line text-muted'}`}>
          {TAG_LABELS[r.tag] ?? r.tag}
        </span>
      </div>

      <div className="space-y-5">

        {/* Restaurant info */}
        <Section title="Restaurant">
          <InfoRow label="Name"        value={r.name} />
          <InfoRow label="Owner"       value={r.owner_name} />
          <InfoRow label="Phone"       value={r.owner_phone} />
          <InfoRow label="Address"     value={r.address} />
          <InfoRow label="Cuisine"     value={r.cuisine_type} />
          <InfoRow label="Avg meal price" value={r.avg_meal_price_naira != null ? `₦${r.avg_meal_price_naira.toLocaleString()}` : null} />
          <InfoRow label="Daily volume" value={r.daily_order_volume_estimate != null ? `~${r.daily_order_volume_estimate} orders` : null} />
          <InfoRow label="Zone"        value={r.zones?.name} />
        </Section>

        {/* Assessment */}
        <Section title="Assessment">
          <InfoRow label="Owner reaction" value={r.owner_reaction != null ? `${r.owner_reaction}/5` : null} />
          <InfoRow label="Lead tag"        value={r.tag ? TAG_LABELS[r.tag] : null} />
          <InfoRow label="Quality score"   value={r.quality_score != null ? `${r.quality_score}%` : null} />
          <InfoRow label="Currently delivers" value={r.currently_delivers ? 'Yes' : 'No'} />
          <InfoRow label="Delivery method" value={r.delivery_method} />
          <InfoRow label="Has smartphone"  value={r.has_smartphone ? 'Yes' : 'No'} />
          <InfoRow label="Has bank account" value={r.has_bank_account ? 'Yes' : 'No'} />
          <InfoRow label="Has POS"         value={r.has_pos ? 'Yes' : 'No'} />
        </Section>

        {/* Notes */}
        {r.notes && (
          <Section title="Notes">
            <div className="px-5 py-4">
              <p className="text-sm text-ink leading-relaxed">{r.notes}</p>
            </div>
          </Section>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-2 px-1">Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {photos.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <a href={signedUrls[p.id] ?? '#'} target="_blank" rel="noopener noreferrer">
                    {signedUrls[p.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signedUrls[p.id]}
                        alt={p.photo_type}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-cream flex items-center justify-center">
                        <span className="text-muted text-sm">No preview</span>
                      </div>
                    )}
                  </a>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-muted capitalize">{p.photo_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <Section title="GPS">
          <InfoRow label="Latitude"  value={r.lat?.toFixed(6)} />
          <InfoRow label="Longitude" value={r.lng?.toFixed(6)} />
          <InfoRow label="Accuracy"  value={r.gps_accuracy_m != null ? `±${Math.round(r.gps_accuracy_m)}m` : null} />
        </Section>

      </div>
    </div>
  )
}
