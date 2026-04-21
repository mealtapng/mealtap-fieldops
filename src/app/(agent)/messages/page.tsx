import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/agent/BottomNav'
import { MessagesView } from '@/components/agent/MessagesView'

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const uid = user.id

  // ── Wave 1: parallel independent fetches ─────────────────────────────────

  const [postsResult, threadsResult, profileResult] = await Promise.all([
    (supabase as any)
      .from('board_posts')
      .select('*, author:users!posted_by(id, full_name, role)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),

    (supabase as any)
      .from('dm_threads')
      .select('*, agent:users!agent_id(id, full_name, role), supervisor:users!supervisor_id(id, full_name, role)')
      .or(`agent_id.eq.${uid},supervisor_id.eq.${uid}`)
      .order('last_message_at', { ascending: false, nullsFirst: false }),

    (supabase as any)
      .from('users')
      .select('id, role, full_name, assigned_zone_id')
      .eq('id', uid)
      .single(),
  ])

  const posts   = postsResult.data   ?? []
  const threads = threadsResult.data  ?? []
  const profile = profileResult.data

  if (!profile) redirect('/login')

  const postIds   = posts.map((p: any) => p.id)
  const threadIds = threads.map((t: any) => t.id)

  // ── Wave 2: depends on wave 1 ─────────────────────────────────────────────

  const [reactionsResult, unreadResult, contactsResult] = await Promise.all([
    postIds.length > 0
      ? (supabase as any).from('board_reactions').select('*').in('post_id', postIds)
      : Promise.resolve({ data: [] }),

    threadIds.length > 0
      ? (supabase as any)
          .from('dm_messages')
          .select('thread_id')
          .in('thread_id', threadIds)
          .is('read_at', null)
          .neq('sender_id', uid)
      : Promise.resolve({ data: [] }),

    // All active users except self — for the "New Message" picker
    (supabase as any)
      .from('users')
      .select('id, full_name, role')
      .eq('is_active', true)
      .neq('id', uid)
      .order('full_name'),
  ])

  const reactions  = reactionsResult.data ?? []
  const unreadRows = unreadResult.data     ?? []
  const contacts   = contactsResult.data   ?? []

  // Build unread count per thread
  const unreadCounts: Record<string, number> = {}
  for (const row of unreadRows) {
    unreadCounts[row.thread_id] = (unreadCounts[row.thread_id] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">
        <MessagesView
          currentUser={{ id: uid, role: profile.role, full_name: profile.full_name }}
          posts={posts}
          reactions={reactions}
          threads={threads}
          unreadCounts={unreadCounts}
          contacts={contacts}
        />
        <BottomNav />
      </div>
    </div>
  )
}
