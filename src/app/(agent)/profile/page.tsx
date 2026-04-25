import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/agent/ProfileView'
import type { User } from '@/lib/types/database'

async function awaitCount(query: any): Promise<number> {
  const { count } = await query
  return count ?? 0
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [
    profileResult,
    totalCaptures,
    hotLeads,
    captureRows,
    settingsResult,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single() as unknown as Promise<{ data: User | null; error: Error | null }>,
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', authUser.id)),
    awaitCount(supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('captured_by', authUser.id).eq('tag', 'hot')),
    supabase.from('restaurants').select('created_at').eq('captured_by', authUser.id),
    supabase.from('app_settings').select('key, value').eq('key', 'hot_lead_bonus') as unknown as Promise<{ data: { key: string; value: string }[] | null }>,
  ])

  const profile = profileResult.data
  if (!profile) redirect('/login')

  const daysActive = new Set(
    (captureRows.data ?? []).map((r: { created_at: string }) => r.created_at.slice(0, 10))
  ).size

  const hotLeadBonus = parseInt(settingsResult.data?.[0]?.value ?? '500', 10)

  let zoneName: string | null = null
  if (profile.assigned_zone_id) {
    const { data: zones } = await supabase.from('zones').select('id, name').in('id', [profile.assigned_zone_id]) as unknown as { data: { id: string; name: string }[] | null }
    zoneName = zones?.[0]?.name ?? null
  }

  return (
    <ProfileView
      userId={profile.id}
      fullName={profile.full_name}
      employeeId={profile.employee_id}
      role={profile.role}
      phone={profile.phone}
      email={profile.email}
      dateOfBirth={profile.date_of_birth}
      homeAddress={profile.home_address}
      ninLast4={profile.nin_last_4}
      nextOfKinName={profile.next_of_kin_name}
      nextOfKinPhone={profile.next_of_kin_phone}
      bankName={profile.bank_name}
      bankAccountMasked={profile.bank_account_masked}
      passportPhotoUrl={profile.passport_photo_url}
      qualityScore={profile.quality_score}
      zoneName={zoneName}
      totalCaptures={totalCaptures}
      hotLeads={hotLeads}
      daysActive={daysActive}
      hotLeadBonus={hotLeadBonus}
    />
  )
}
