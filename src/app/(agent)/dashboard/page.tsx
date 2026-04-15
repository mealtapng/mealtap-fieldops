import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single() as { data: Pick<User, 'full_name' | 'role'> | null; error: Error | null }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-forest mb-2">Dashboard coming soon</h1>
        <p className="text-muted-brand text-sm">
          Welcome, {profile?.full_name ?? 'Agent'}
        </p>
      </div>
    </main>
  )
}
