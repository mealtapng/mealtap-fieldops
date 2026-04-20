import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { AdminMessagesView } from '@/components/admin/AdminMessagesView'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch current admin profile
  const { data: profile } = await (admin as any)
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  const [postsResult, threadsResult, reactionsResult, agentsResult, unreadResult] = await Promise.all([
    // Board posts, pinned first
    (admin as any)
      .from('board_posts')
      .select('*, author:users!posted_by(id, full_name, role)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),

    // ALL dm threads with both participants
    (admin as any)
      .from('dm_threads')
      .select('id, agent_id, supervisor_id, created_at, last_message_at, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
      .order('last_message_at', { ascending: false, nullsFirst: false }),

    // All reactions for board posts
    (admin as any)
      .from('board_reactions')
      .select('*'),

    // All agents/field leads for "New Message" picker
    (admin as any)
      .from('users')
      .select('id, full_name, employee_id, role')
      .in('role', ['agent', 'field_lead'])
      .eq('is_active', true)
      .order('full_name'),

    // Unread counts: messages with read_at IS NULL, not sent by this admin
    (admin as any)
      .from('dm_messages')
      .select('thread_id')
      .is('read_at', null)
      .neq('sender_id', user.id),
  ])

  // Build unread counts per thread
  const unreadCounts: Record<string, number> = {}
  for (const msg of (unreadResult.data ?? [])) {
    unreadCounts[msg.thread_id] = (unreadCounts[msg.thread_id] ?? 0) + 1
  }

  return (
    <AdminMessagesView
      currentUser={{ id: user.id, full_name: profile?.full_name ?? 'Admin', role: profile?.role ?? 'admin' }}
      posts={postsResult.data ?? []}
      reactions={reactionsResult.data ?? []}
      threads={threadsResult.data ?? []}
      unreadCounts={unreadCounts}
      agents={agentsResult.data ?? []}
    />
  )
}
