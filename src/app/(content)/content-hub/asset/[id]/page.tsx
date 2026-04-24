export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { AssetDetailView } from '@/components/content/AssetDetailView'

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string
  if (role !== 'admin' && role !== 'content_manager') redirect('/dashboard')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: asset, error } = await (admin as any)
    .from('content_assets')
    .select('*, week:content_weeks(id, title, start_date, end_date, week_number), uploader:users!uploaded_by(id, full_name), poster:users!posted_by(id, full_name)')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !asset) notFound()

  return (
    <AssetDetailView
      asset={asset}
      currentUserId={user.id}
      isAdmin={role === 'admin'}
    />
  )
}
