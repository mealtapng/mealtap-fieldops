import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/agent/ProfileView'
import type { User } from '@/lib/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function awaitCount(query: any): Promise<number> {
  const { count } = await query
  return count ?? 0
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // ── Parallel data fetches ──────────────────────────────────────────────────

  const [
    profileResult,
    totalOnboardings,
    conversions,
    onboardingRows,
  ] = await Promise.all([
    // Full user profile
    supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as unknown as Promise<{ data: User | null; error: Error | null }>,

    // Total onboardings count
    awaitCount(
      supabase
        .from('onboardings')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', authUser.id)
    ),

    // Conversions count
    awaitCount(
      supabase
        .from('onboardings')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', authUser.id)
        .eq('conversion_status', 'converted')
    ),

    // All onboarding timestamps (for distinct-day count)
    supabase
      .from('onboardings')
      .select('created_at')
      .eq('agent_id', authUser.id),
  ])

  const profile = profileResult.data
  if (!profile) redirect('/login')

  // Days active: count distinct calendar dates
  const daysActive = new Set(
    (onboardingRows.data ?? []).map((r: { created_at: string }) => r.created_at.slice(0, 10))
  ).size

  // ── Zone name lookup ───────────────────────────────────────────────────────

  let zoneName: string | null = null
  if (profile.assigned_zone_id) {
    const { data: zones } = await supabase
      .from('zones')
      .select('id, name')
      .in('id', [profile.assigned_zone_id]) as unknown as { data: { id: string; name: string }[] | null }
    zoneName = zones?.[0]?.name ?? null
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
      referralCode={profile.referral_code}
      totalOnboardings={totalOnboardings}
      conversions={conversions}
      daysActive={daysActive}
    />
  )
}
