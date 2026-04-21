import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DeactivateButton } from '@/components/admin/DeactivateButton'
import { ReactivateButton } from '@/components/admin/ReactivateButton'

const ROLE_LABELS: Record<string, string> = {
  agent:      'Agent',
  field_lead: 'Field Lead',
}

const STATUS_LABELS: Record<string, string> = {
  converted: '✅ Converted',
  pending:   '⏳ Pending',
  failed:    '✕ Not interested',
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-success-light text-success',
  pending:   'bg-amber-50 text-amber-700',
  failed:    'bg-line text-muted-brand',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [agentResult, onboardingsResult, zonesResult] = await Promise.all([
    (supabase as any)
      .from('users')
      .select('id, full_name, employee_id, phone, role, assigned_zone_id, quality_score, is_active, created_at, passport_photo_url, email, date_of_birth, home_address, nin_last_4, next_of_kin_name, next_of_kin_phone, bank_name, bank_account_masked')
      .eq('id', params.id)
      .single(),
    (supabase as any)
      .from('onboardings')
      .select('id, user_name, disco_area, conversion_status, created_at')
      .eq('agent_id', params.id)
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

  const onboardings = onboardingsResult.data ?? []
  const totalOnboardings = onboardings.length
  const conversions      = onboardings.filter((r: any) => r.conversion_status === 'converted').length
  const earnings         = conversions * 100

  const joinedDate = a.created_at
    ? new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="p-6 max-w-2xl">
      {/* Back */}
      <a href="/admin/agents" className="inline-flex items-center gap-1 text-sm text-muted-brand hover:text-brand transition-colors mb-6">
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{initials(a.full_name)}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-ink">{a.full_name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                a.is_active ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-500'
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
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-line">
          <div className="bg-cream rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-ink">{totalOnboardings}</p>
            <p className="text-xs text-muted-brand mt-1">Onboardings</p>
          </div>
          <div className="bg-success-light rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">{conversions}</p>
            <p className="text-xs text-muted-brand mt-1">Conversions</p>
          </div>
          <div className="bg-brand/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand">₦{earnings.toLocaleString()}</p>
            <p className="text-xs text-muted-brand mt-1">Earnings</p>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-line">
          <p className="font-bold text-ink">Profile details</p>
        </div>
        {[
          { label: 'Email',        value: a.email               ?? '—' },
          { label: 'Date of birth',value: a.date_of_birth       ? new Date(a.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          { label: 'Home address', value: a.home_address        ?? '—' },
          { label: 'NIN (last 4)', value: a.nin_last_4          ? `•••• •••• ${a.nin_last_4}` : '—' },
          { label: 'Next of kin',  value: a.next_of_kin_name    ?? '—' },
          { label: 'NoK phone',    value: a.next_of_kin_phone   ?? '—' },
          { label: 'Bank',         value: a.bank_name           ?? '—' },
          { label: 'Account',      value: a.bank_account_masked ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-6 py-3 border-b border-line last:border-0">
            <span className="text-xs font-semibold text-muted-brand uppercase tracking-wider w-32 flex-shrink-0">{label}</span>
            <span className={`text-sm text-right ${value === '—' ? 'text-muted-brand' : 'text-ink'}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Recent onboardings */}
      {onboardings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-line">
            <p className="font-bold text-ink">Recent onboardings</p>
          </div>
          <div className="divide-y divide-line">
            {onboardings.map((r: any) => {
              const date = r.created_at
                ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : '—'
              return (
                <div key={r.id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="text-base">⚡</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{r.user_name}</p>
                    <p className="text-xs text-muted-brand">{r.disco_area ?? '—'}</p>
                  </div>
                  {r.conversion_status && (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.conversion_status] ?? 'bg-line text-muted-brand'}`}>
                      {STATUS_LABELS[r.conversion_status] ?? r.conversion_status}
                    </span>
                  )}
                  <span className="text-xs text-muted-brand flex-shrink-0">{date}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Danger / recovery zone */}
      {a.is_active ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="text-sm font-bold text-ink mb-1">Danger zone</h2>
          <p className="text-sm text-muted-brand mb-4">
            Deactivating this agent revokes their login immediately.
          </p>
          <DeactivateButton agentId={a.id} agentName={a.full_name} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand/20 p-6">
          <h2 className="text-sm font-bold text-ink mb-1">Reactivate agent</h2>
          <p className="text-sm text-muted-brand mb-4">
            Restores login access and resets failed attempts.
          </p>
          <ReactivateButton agentId={a.id} agentName={a.full_name} />
        </div>
      )}
    </div>
  )
}
