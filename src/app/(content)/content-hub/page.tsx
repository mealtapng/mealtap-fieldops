export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { ContentHubView } from '@/components/content/ContentHubView'

export default async function ContentHubPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string
  if (role !== 'admin' && role !== 'content_manager') redirect('/dashboard')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const [weeksRes, boardRes, reactionsRes, profileRes] = await Promise.all([
    (admin as any)
      .from('content_weeks')
      .select('*, assets:content_assets(id, status, day_of_week)')
      .order('start_date', { ascending: false }),

    (admin as any)
      .from('content_board_posts')
      .select('*, author:users!author_id(id, full_name, role)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),

    (admin as any).from('content_board_reactions').select('*'),

    (admin as any).from('users').select('id, full_name, role').eq('id', user.id).single(),
  ])

  const weeks = (weeksRes.data ?? []).map((w: any) => ({
    ...w,
    asset_count: w.assets?.length ?? 0,
    assets: undefined,
  }))

  const activeWeek = weeks.find((w: any) => w.status === 'active') ?? weeks[0] ?? null

  // Fetch assets for the active week
  let activeAssets: any[] = []
  if (activeWeek) {
    const { data } = await (admin as any)
      .from('content_assets')
      .select('*, uploader:users!uploaded_by(id, full_name)')
      .eq('week_id', activeWeek.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    activeAssets = data ?? []
  }

  return (
    <ContentHubView
      currentUser={{ id: user.id, full_name: profileRes.data?.full_name ?? '', role }}
      initialTab={(searchParams.tab as any) ?? 'week'}
      weeks={weeks}
      activeWeek={activeWeek}
      activeAssets={activeAssets}
      boardPosts={boardRes.data ?? []}
      boardReactions={reactionsRes.data ?? []}
    />
  )
}
