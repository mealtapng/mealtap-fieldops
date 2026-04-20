import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  converted: '✅ Converted',
  pending:   '⏳ Pending',
  failed:    '✕ Not interested',
}

const STATUS_STYLES: Record<string, string> = {
  converted: 'bg-success-light text-success border border-success/30',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-line text-muted-brand border border-line',
}

const CHECKLIST_ITEMS = [
  { key: 'checklist_saved_number',  label: 'Saved PowerChat number' },
  { key: 'checklist_sent_hi',       label: 'Sent "Hi" on WhatsApp' },
  { key: 'checklist_entered_code',  label: 'Entered referral code' },
  { key: 'checklist_purchased_token', label: 'Purchased token' },
] as const

export default async function OnboardingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await (supabase as any)
    .from('onboardings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!result.data) notFound()

  const r = result.data

  // Resolve agent + zone names
  const [agentResult, zoneResult] = await Promise.all([
    r.agent_id
      ? (supabase as any).from('users').select('full_name, phone, referral_code').eq('id', r.agent_id).single()
      : Promise.resolve({ data: null }),
    r.zone_id
      ? (supabase as any).from('zones').select('name').eq('id', r.zone_id).single()
      : Promise.resolve({ data: null }),
  ])

  const agent    = agentResult.data
  const zoneName = zoneResult.data?.name ?? null

  const createdDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const status = r.conversion_status ?? 'pending'

  return (
    <div className="p-6 max-w-2xl">
      {/* Back */}
      <a href="/admin/onboardings" className="inline-flex items-center gap-1 text-sm text-muted-brand hover:text-brand transition-colors mb-6">
        ← All Onboardings
      </a>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h1 className="text-xl font-bold text-ink">{r.user_name}</h1>
            </div>
            <p className="text-sm text-muted-brand">{createdDate}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 ${STATUS_STYLES[status] ?? 'bg-line text-muted-brand'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-line">
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Phone</p>
            <p className="text-sm text-ink">{r.user_phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Meter Number</p>
            <p className="text-sm text-ink font-mono">{r.meter_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">DISCO</p>
            <p className="text-sm text-ink">{r.disco_area ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Zone</p>
            <p className="text-sm text-ink">{zoneName ?? '—'}</p>
          </div>
          {r.address && (
            <div className="col-span-2">
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Address</p>
              <p className="text-sm text-ink">{r.address}</p>
            </div>
          )}
          {r.referral_code && (
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Referral Code</p>
              <p className="text-sm text-ink font-mono">{r.referral_code}</p>
            </div>
          )}
          {r.token_amount_purchased != null && (
            <div>
              <p className="text-xs font-bold text-muted-brand uppercase tracking-wider mb-1">Token Amount</p>
              <p className="text-sm font-bold text-success">₦{r.token_amount_purchased.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
        <p className="font-bold text-ink mb-4">WhatsApp Checklist</p>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map(item => {
            const checked = !!r[item.key]
            return (
              <div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl ${checked ? 'bg-success-light' : 'bg-cream/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${checked ? 'bg-success' : 'bg-line'}`}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <p className={`text-sm ${checked ? 'text-success font-semibold' : 'text-muted-brand'}`}>{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent */}
      {agent && (
        <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
          <p className="font-bold text-ink mb-4">Agent</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-success flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {agent.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{agent.full_name}</p>
              <p className="text-xs text-muted-brand">{agent.phone ?? '—'} · {agent.referral_code ?? '—'}</p>
            </div>
            <a
              href={`/admin/agents/${r.agent_id}`}
              className="ml-auto text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              View profile →
            </a>
          </div>
        </div>
      )}

      {/* Notes */}
      {r.notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-line p-6">
          <p className="font-bold text-ink mb-2">Notes</p>
          <p className="text-sm text-muted-brand leading-relaxed">{r.notes}</p>
        </div>
      )}
    </div>
  )
}
