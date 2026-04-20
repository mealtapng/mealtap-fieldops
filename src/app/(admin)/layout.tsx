import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <AdminSidebar user={profile} />
      <main className="flex-1 overflow-y-auto min-w-0 relative">
        {children}
      </main>
    </div>
  )
}
