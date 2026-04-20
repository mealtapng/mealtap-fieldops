-- =============================================================================
-- Mealtap Field Ops — 005_messages_enhancements.sql
-- Adds columns needed by the Messages feature + RLS policies for reactions.
-- Run each statement separately in the Supabase SQL Editor if needed.
-- =============================================================================

-- board_posts: add pinning and post type
ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_type text    NOT NULL DEFAULT 'announcement';

-- dm_threads: track last message time for ordering
ALTER TABLE public.dm_threads
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- board_reactions: RLS was enabled but no policies existed
CREATE POLICY board_reactions_read ON public.board_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY board_reactions_insert ON public.board_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY board_reactions_delete ON public.board_reactions
  FOR DELETE USING (user_id = auth.uid());

-- dm_messages: allow thread parties to mark messages as read (set read_at)
CREATE POLICY dm_messages_update ON public.dm_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_id
        AND (t.agent_id = auth.uid() OR t.supervisor_id = auth.uid())
    )
  );
