import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminProfileView } from '@/components/admin/AdminProfileView'

export default async function AdminProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, captureResult] = await Promise.all([
    (supabase as any)
      .from('users')
      .select('id, full_name, employee_id, role, phone, email, date_of_birth, home_address, next_of_kin_name, next_of_kin_phone, passport_photo_url')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('restaurants')
      .select('created_at, tag')
      .eq('captured_by', user.id),
  ])

  if (!profileResult.data) redirect('/login')

  const profile = profileResult.data
  const captures = captureResult.data ?? []
  const totalCaptures = captures.length
  const hotLeads = captures.filter((r: any) => r.tag === 'hot').length
  const daysActive = new Set(captures.map((r: any) => r.created_at.slice(0, 10))).size

  return (
    <AdminProfileView
      userId={profile.id}
      fullName={profile.full_name}
      employeeId={profile.employee_id}
      role={profile.role}
      phone={profile.phone}
      email={profile.email}
      dateOfBirth={profile.date_of_birth}
      homeAddress={profile.home_address}
      nextOfKinName={profile.next_of_kin_name}
      nextOfKinPhone={profile.next_of_kin_phone}
      passportPhotoUrl={profile.passport_photo_url}
      totalCaptures={totalCaptures}
      hotLeads={hotLeads}
      daysActive={daysActive}
    />
  )
}
