import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatNaira, formatPhone } from '@/lib/format'

const RestaurantDetailMap = dynamic(
  () => import('@/components/admin/RestaurantDetailMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-xl bg-cream flex items-center justify-center" style={{ height: '300px' }}>
        <p className="text-sm text-muted-brand">Loading map…</p>
      </div>
    ),
  }
)

const TAG_STYLES: Record<string, string> = {
  hot:       'bg-terra-light text-terra border border-terra/30',
  warm:      'bg-forest-light text-forest border border-forest/30',
  cold:      'bg-line text-muted-brand border border-line',
  not_a_fit: 'bg-red-50 text-red-500 border border-red-200',
}

const TAG_LABELS: Record<string, string> = {
  hot:       '🔥 Hot',
  warm:      '☀️ Warm',
  cold:      '❄️ Cold',
  not_a_fit: '✕ Not a fit',
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  menu:       'Menu',
  dish:       'Dish',
}

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  none:      'None',
  calls:     'Phone calls',
  whatsapp:  'WhatsApp',
  chowdeck:  'Chowdeck',
  glovo:     'Glovo',
  bolt:      'Bolt Food',
  other:     'Other',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function ReactionDots({ score }: { score: number | null }) {
  if (score == null) return <span className="text-sm text-muted-brand">—</span>
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full ${i <= score ? 'bg-terra' : 'bg-line'}`}
        />
      ))}
      <span className="ml-1.5 text-sm text-muted-brand">{score}/5</span>
    </div>
  )
}

function BoolBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value == null) return <span className="text-sm text-muted-brand">{label}: —</span>
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${value ? 'text-forest' : 'text-muted-brand'}`}>
      <span className={`w-2 h-2 rounded-full ${value ? 'bg-forest' : 'bg-line'}`} />
      {label}
    </span>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm text-ink">{value ?? <span className="text-muted-brand">—</span>}</div>
    </div>
  )
}

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: r, error } = await (supabase as any)
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !r) notFound()

  const [photosResult, agentResult, zoneResult] = await Promise.all([
    (supabase as any).from('restaurant_photos').select('*').eq('restaurant_id', r.id),
    (supabase as any).from('users').select('id, full_name, employee_id, passport_photo_url').eq('id', r.captured_by).single(),
    r.zone_id
      ? (supabase as any).from('zones').select('id, name').eq('id', r.zone_id).single()
      : Promise.resolve({ data: null }),
  ])

  // Resolve photo public URLs server-side
  const photos = (photosResult.data ?? []).map((p: any) => ({
    id:   p.id,
    type: p.photo_type as string,
    url:  (supabase as any).storage.from('restaurant-photos').getPublicUrl(p.photo_url).data.publicUrl as string,
  }))

  const agent    = agentResult.data
  const zoneName = zoneResult.data?.name ?? null

  const capturedAt = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }) + ' · ' + new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="p-6 max-w-4xl">
      {/* Back */}
      <a href="/admin/restaurants" className="inline-flex items-center gap-1 text-sm text-muted-brand hover:text-forest transition-colors mb-6">
        ← All Restaurants
      </a>

      {/* Title row */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{r.name}</h1>
          {r.address && <p className="text-sm text-muted-brand mt-0.5">{r.address}</p>}
        </div>
        {r.tag && (
          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${TAG_STYLES[r.tag] ?? 'bg-line text-muted-brand'}`}>
            {TAG_LABELS[r.tag] ?? r.tag}
          </span>
        )}
      </div>

      {/* Section 1 — Map + Location */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
        <h2 className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-4">Location</h2>
        {r.lat != null && r.lng != null ? (
          <RestaurantDetailMap lat={r.lat} lng={r.lng} name={r.name} />
        ) : (
          <div className="w-full rounded-xl bg-cream flex items-center justify-center" style={{ height: '200px' }}>
            <p className="text-sm text-muted-brand">No GPS coordinates recorded</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Field label="Address" value={r.address} />
          <Field
            label="GPS Coordinates"
            value={r.lat != null && r.lng != null
              ? `${Number(r.lat).toFixed(6)}, ${Number(r.lng).toFixed(6)}`
              : null}
          />
          <Field
            label="GPS Accuracy"
            value={r.gps_accuracy_m != null ? `±${r.gps_accuracy_m}m` : null}
          />
        </div>
      </div>

      {/* Sections 2 + 3 side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Section 2 — Restaurant Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-line p-6">
          <h2 className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-4">Restaurant Info</h2>
          <div className="space-y-4">
            <Field label="Owner name"  value={r.owner_name} />
            <Field label="Owner phone" value={r.owner_phone ? formatPhone(r.owner_phone) : null} />
            <Field label="Cuisine type" value={r.cuisine_type} />
            <Field
              label="Avg meal price"
              value={r.avg_meal_price_naira != null ? formatNaira(r.avg_meal_price_naira) : null}
            />
            <Field
              label="Daily order volume"
              value={r.daily_order_volume_estimate != null ? `~${r.daily_order_volume_estimate} orders/day` : null}
            />
            <Field
              label="Currently delivers"
              value={r.currently_delivers != null ? (r.currently_delivers ? 'Yes' : 'No') : null}
            />
            <Field
              label="Delivery method"
              value={r.delivery_method ? (DELIVERY_METHOD_LABELS[r.delivery_method] ?? r.delivery_method) : null}
            />
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <BoolBadge value={r.has_smartphone}  label="Smartphone" />
                <BoolBadge value={r.has_bank_account} label="Bank account" />
                <BoolBadge value={r.has_pos}          label="POS" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — Assessment */}
        <div className="bg-white rounded-2xl shadow-sm border border-line p-6">
          <h2 className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-4">Assessment</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1.5">Owner reaction</p>
              <ReactionDots score={r.owner_reaction} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1.5">Lead tag</p>
              {r.tag ? (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${TAG_STYLES[r.tag] ?? 'bg-line text-muted-brand'}`}>
                  {TAG_LABELS[r.tag] ?? r.tag}
                </span>
              ) : (
                <span className="text-sm text-muted-brand">—</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1.5">Quality score</p>
              <span className={`text-sm font-semibold ${
                r.quality_score == null    ? 'text-muted-brand' :
                r.quality_score >= 80      ? 'text-forest' :
                r.quality_score >= 50      ? 'text-amber-600' : 'text-terra'
              }`}>
                {r.quality_score != null ? `${r.quality_score}%` : '—'}
              </span>
            </div>
            {r.notes && (
              <div>
                <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1.5">Agent notes</p>
                <blockquote className="text-sm text-ink bg-cream rounded-xl px-4 py-3 border-l-2 border-forest/40 leading-relaxed">
                  {r.notes}
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4 — Photos */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
          <h2 className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-4">
            Photos <span className="font-normal normal-case">({photos.length})</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo: { id: string; type: string; url: string }) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden border border-line hover:border-forest/40 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={PHOTO_TYPE_LABELS[photo.type] ?? photo.type}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="px-3 py-2 bg-white">
                  <p className="text-xs font-semibold text-muted-brand">
                    {PHOTO_TYPE_LABELS[photo.type] ?? photo.type}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Section 5 — Capture metadata */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-6">
        <h2 className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-4">Capture metadata</h2>
        <div className="flex items-center gap-4">
          {agent ? (
            <div className="flex items-center gap-3">
              {agent.passport_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.passport_photo_url} alt={agent.full_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-forest/70 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{initials(agent.full_name)}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
                <p className="text-xs text-muted-brand">{agent.employee_id ?? '—'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-brand">Unknown agent</p>
          )}

          <div className="ml-auto text-right">
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-0.5">Captured at</p>
            <p className="text-sm text-ink">{capturedAt}</p>
          </div>

          {zoneName && (
            <div className="text-right">
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-0.5">Zone</p>
              <p className="text-sm text-ink">{zoneName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
