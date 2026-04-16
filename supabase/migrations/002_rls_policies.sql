-- =============================================================================
-- Mealtap Field Ops — 002_rls_policies.sql
-- Run this SECOND, after 001_initial_schema.sql has been applied successfully.
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

ALTER TABLE public.zones               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_threads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages         ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- zones policies
-- ---------------------------------------------------------------------------

-- All authenticated users can read all zones (zone names are not sensitive).
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

-- Agents see only their own row; field leads and admins see everyone.
CREATE POLICY users_self_read ON public.users
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.get_my_role() IN ('admin', 'field_lead')
  );

-- Only admins and field leads can update user records.
CREATE POLICY users_admin_update ON public.users
  FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'field_lead'));

-- ---------------------------------------------------------------------------
-- restaurants policies
-- ---------------------------------------------------------------------------

-- Agents see only their own captures; field leads and admins see all.
CREATE POLICY restaurants_read ON public.restaurants
  FOR SELECT
  USING (
    captured_by = auth.uid()
    OR public.get_my_role() IN ('admin', 'field_lead')
  );

-- Agents can only insert restaurants where they are the capturer.
CREATE POLICY restaurants_insert ON public.restaurants
  FOR INSERT
  WITH CHECK (captured_by = auth.uid());

-- Agents can update their own captures; field leads and admins can update all.
CREATE POLICY restaurants_update ON public.restaurants
  FOR UPDATE
  USING (
    captured_by = auth.uid()
    OR public.get_my_role() IN ('admin', 'field_lead')
  );

-- ---------------------------------------------------------------------------
-- restaurant_photos policies
-- ---------------------------------------------------------------------------

-- Access mirrors the parent restaurant: see photos only for accessible restaurants.
CREATE POLICY restaurant_photos_read ON public.restaurant_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND (r.captured_by = auth.uid() OR public.get_my_role() IN ('admin', 'field_lead'))
    )
  );

-- Uploaders must have access to the parent restaurant.
CREATE POLICY restaurant_photos_insert ON public.restaurant_photos
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND (r.captured_by = auth.uid() OR public.get_my_role() IN ('admin', 'field_lead'))
    )
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

-- =============================================================================
-- END OF 002_rls_policies.sql
-- Verify: go to Authentication > Policies in the Supabase dashboard.
-- You should see policies listed for each table above.
-- =============================================================================
