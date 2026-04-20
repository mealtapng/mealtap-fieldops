-- =============================================================================
-- PowerChat Field Ops — 004_powerchat_rls.sql
--
-- Row Level Security policies for all tables.
-- Run AFTER 003_powerchat_schema.sql has been applied successfully.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: get_my_role()
-- Returns the role of the currently authenticated user.
-- SECURITY DEFINER + STABLE avoids infinite recursion when the users table
-- policy itself calls this function, and is safe to use in all policies.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;


-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.zones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboardings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages    ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- zones policies
-- ---------------------------------------------------------------------------

-- All authenticated users can read zones (names are not sensitive).
CREATE POLICY zones_read_all ON public.zones
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins and field leads can create or modify zones.
CREATE POLICY zones_admin_write ON public.zones
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'field_lead'))
  WITH CHECK (public.get_my_role() IN ('admin', 'field_lead'));


-- ---------------------------------------------------------------------------
-- users policies
-- ---------------------------------------------------------------------------

-- Any authenticated user can read any user's basic profile.
-- Required for board post author display and DM thread participant names.
CREATE POLICY users_read_all ON public.users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins and field leads can update user records (all fields).
CREATE POLICY users_admin_update ON public.users
  FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'field_lead'));

-- Agents can update their own passport photo URL (self-service photo upload).
CREATE POLICY users_self_update_photo ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ---------------------------------------------------------------------------
-- onboardings policies
-- ---------------------------------------------------------------------------

-- Agents see only their own onboardings; field leads and admins see all.
CREATE POLICY onboardings_read ON public.onboardings
  FOR SELECT
  USING (
    agent_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'field_lead')
  );

-- Agents can only insert onboardings where they are the agent.
CREATE POLICY onboardings_insert ON public.onboardings
  FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- Agents can update their own onboardings; field leads and admins can update all.
CREATE POLICY onboardings_update ON public.onboardings
  FOR UPDATE
  USING (
    agent_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'field_lead')
  );


-- ---------------------------------------------------------------------------
-- board_posts policies
-- ---------------------------------------------------------------------------

-- Everyone authenticated can read board posts.
CREATE POLICY board_posts_read ON public.board_posts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only field leads and admins can create posts.
CREATE POLICY board_posts_write ON public.board_posts
  FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'field_lead'));

-- Only the post author or admins can update posts.
CREATE POLICY board_posts_update ON public.board_posts
  FOR UPDATE
  USING (
    posted_by = auth.uid()
    OR public.get_my_role() = 'admin'
  );


-- ---------------------------------------------------------------------------
-- board_reactions policies
-- ---------------------------------------------------------------------------

CREATE POLICY board_reactions_read ON public.board_reactions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY board_reactions_insert ON public.board_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY board_reactions_delete ON public.board_reactions
  FOR DELETE
  USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- dm_threads policies
-- ---------------------------------------------------------------------------

-- Only the two parties (agent or supervisor) can see or create a thread.
CREATE POLICY dm_threads_read ON public.dm_threads
  FOR SELECT
  USING (
    agent_id = auth.uid()
    OR supervisor_id = auth.uid()
  );

CREATE POLICY dm_threads_insert ON public.dm_threads
  FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    OR supervisor_id = auth.uid()
  );


-- ---------------------------------------------------------------------------
-- dm_messages policies
-- ---------------------------------------------------------------------------

-- Only the two parties in the thread can read messages.
CREATE POLICY dm_messages_read ON public.dm_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_id
        AND (t.agent_id = auth.uid() OR t.supervisor_id = auth.uid())
    )
  );

-- Sender must be a party in the thread and must identify themselves correctly.
CREATE POLICY dm_messages_write ON public.dm_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_id
        AND (t.agent_id = auth.uid() OR t.supervisor_id = auth.uid())
    )
  );

-- Thread parties can mark messages as read (set read_at).
CREATE POLICY dm_messages_update ON public.dm_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_id
        AND (t.agent_id = auth.uid() OR t.supervisor_id = auth.uid())
    )
  );


-- =============================================================================
-- END OF 004_powerchat_rls.sql
-- Verify: Supabase → Authentication → Policies — all tables should have policies.
-- Then run supabase/seed/001_zones.sql and 002_lagos_zones.sql.
-- =============================================================================
