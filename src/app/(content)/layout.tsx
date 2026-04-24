import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { ContentSidebar } from '@/components/content/ContentSidebar'

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string
  if (role !== 'admin' && role !== 'content_manager') redirect('/dashboard')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile } = await (admin as any)
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0F7F0' }}>
      <ContentSidebar user={profile} />
      <main className="flex-1 overflow-y-auto min-w-0 relative md:ml-[220px]">
        {children}
      </main>
    </div>
  )
}
