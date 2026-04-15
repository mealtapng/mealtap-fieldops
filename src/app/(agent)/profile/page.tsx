import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types/database'
import { SignOutButton } from './sign-out-button'

type ProfileRow = Pick<User, 'full_name' | 'employee_id' | 'phone' | 'role'>

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, employee_id, phone, role')
    .eq('id', user.id)
    .single() as { data: ProfileRow | null; error: Error | null }

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: 'Name',        value: profile?.full_name },
    { label: 'Employee ID', value: profile?.employee_id },
    { label: 'Phone',       value: profile?.phone },
    { label: 'Role',        value: profile?.role },
  ]

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

        <h1 className="text-2xl font-bold text-forest mb-1">My Profile</h1>
        <p className="text-sm text-muted-brand mb-8">Your account details</p>

        <div className="space-y-5 mb-10">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold tracking-wider text-muted-brand uppercase mb-1">
                {label}
              </p>
              <p className="text-sm font-medium text-ink">{value ?? '—'}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-6 text-center">
          <SignOutButton />
        </div>

      </div>
    </main>
  )
}
