import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminProfileView } from '@/components/admin/AdminProfileView'

export default async function AdminProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('id, full_name, employee_id, role, phone, email, date_of_birth, home_address, next_of_kin_name, next_of_kin_phone')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <AdminProfileView
      fullName={profile.full_name}
      employeeId={profile.employee_id}
      role={profile.role}
      phone={profile.phone}
      email={profile.email}
      dateOfBirth={profile.date_of_birth}
      homeAddress={profile.home_address}
      nextOfKinName={profile.next_of_kin_name}
      nextOfKinPhone={profile.next_of_kin_phone}
    />
  )
}
