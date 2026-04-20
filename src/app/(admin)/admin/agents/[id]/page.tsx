import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DeactivateButton } from '@/components/admin/DeactivateButton'

const ROLE_LABELS: Record<string, string> = {
  agent:      'Agent',
  field_lead: 'Field Lead',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [agentResult, capturesResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('users')
      .select('id, full_name, employee_id, phone, role, assigned_zone_id, quality_score, is_active, created_at, passport_photo_url')
      .eq('id', params.id)
      .single(),
    (supabase as any)
      .from('restaurants')
      .select('id, name, tag, created_at')
      .eq('captured_by', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
    (supabase as any)
      .from('zones')
      .select('id, name'),
  ])

  if (!agentResult.data) notFound()

  const a = agentResult.data
  const zoneMap: Record<string, string> = {}
  for (const z of (zonesResult.data ?? [])) zoneMap[z.id] = z.name

  const captures = capturesResult.data ?? []
  const totalCaptures = captures.length
  const hotLeads      = captures.filter((r: any) => r.tag === 'hot').length

  const joinedDate = a.created_at
    ? new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="p-6 max-w-2xl">
      {/* Back */}
      <a href="/admin/agents" className="inline-flex items-center gap-1 text-sm text-muted-brand hover:text-forest transition-colors mb-6">
        ← All Agents
      </a>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-6">
        <div className="flex items-start gap-5">
          {a.passport_photo_url ? (
            <img
              src={a.passport_photo_url}
              alt={a.full_name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest to-forest/70 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{initials(a.full_name)}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-ink">{a.full_name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                a.is_active ? 'bg-forest/10 text-forest' : 'bg-red-50 text-red-500'
              }`}>
                {a.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted-brand mt-0.5">
              {a.employee_id ?? '—'} · {ROLE_LABELS[a.role] ?? a.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-line">
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Phone</p>
            <p className="text-sm text-ink">{a.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Zone</p>
            <p className="text-sm text-ink">{a.assigned_zone_id ? (zoneMap[a.assigned_zone_id] ?? '—') : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Quality Score</p>
            <p className="text-sm text-ink">{a.quality_score != null ? `${a.quality_score}%` : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Joined</p>
            <p className="text-sm text-ink">{joinedDate}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
          <div className="bg-cream rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-ink">{totalCaptures}</p>
            <p className="text-xs text-muted-brand mt-1">Total Captures</p>
          </div>
          <div className="bg-terra/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-terra">{hotLeads}</p>
            <p className="text-xs text-muted-brand mt-1">Hot Leads</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      {a.is_active && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="text-sm font-bold text-ink mb-1">Danger zone</h2>
          <p className="text-sm text-muted-brand mb-4">
            Deactivating this agent revokes their login immediately.
          </p>
          <DeactivateButton agentId={a.id} agentName={a.full_name} />
        </div>
      )}
    </div>
  )
}
