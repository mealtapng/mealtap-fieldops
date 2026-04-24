-- =============================================================================
-- PowerChat Field Ops — 008_content_hub_rls.sql
--
-- RLS policies for Content Hub tables.
-- Run AFTER 007_content_hub_schema.sql.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- HELPER: is_content_user()
-- Returns true for admin and content_manager roles.
-- Used in all content hub policies to avoid repeating the check.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_content_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text IN ('admin', 'content_manager')
  FROM public.users
  WHERE id = auth.uid()
$$;


-- ---------------------------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.content_weeks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_board_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_board_reactions ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- content_weeks policies
-- Admin: full access. Content manager: read only.
-- ---------------------------------------------------------------------------

CREATE POLICY content_weeks_select ON public.content_weeks
  FOR SELECT
  USING (public.is_content_user());

CREATE POLICY content_weeks_insert ON public.content_weeks
  FOR INSERT
  WITH CHECK (get_my_role()::text = 'admin');

CREATE POLICY content_weeks_update ON public.content_weeks
  FOR UPDATE
  USING (get_my_role()::text = 'admin')
  WITH CHECK (get_my_role()::text = 'admin');


-- ---------------------------------------------------------------------------
-- content_assets policies
-- Admin + content_manager: read and insert.
-- Admin + content_manager: update (to change status, mark as posted).
-- ---------------------------------------------------------------------------

CREATE POLICY content_assets_select ON public.content_assets
  FOR SELECT
  USING (public.is_content_user());

CREATE POLICY content_assets_insert ON public.content_assets
  FOR INSERT
  WITH CHECK (public.is_content_user() AND uploaded_by = auth.uid());

CREATE POLICY content_assets_update ON public.content_assets
  FOR UPDATE
  USING (public.is_content_user())
  WITH CHECK (public.is_content_user());


-- ---------------------------------------------------------------------------
-- content_board_posts policies
-- Admin + content_manager: read and post.
-- ---------------------------------------------------------------------------

CREATE POLICY content_board_posts_select ON public.content_board_posts
  FOR SELECT
  USING (public.is_content_user());

CREATE POLICY content_board_posts_insert ON public.content_board_posts
  FOR INSERT
  WITH CHECK (public.is_content_user() AND author_id = auth.uid());

CREATE POLICY content_board_posts_update ON public.content_board_posts
  FOR UPDATE
  USING (author_id = auth.uid() OR get_my_role()::text = 'admin')
  WITH CHECK (author_id = auth.uid() OR get_my_role()::text = 'admin');


-- ---------------------------------------------------------------------------
-- content_board_reactions policies
-- ---------------------------------------------------------------------------

CREATE POLICY content_board_reactions_select ON public.content_board_reactions
  FOR SELECT
  USING (public.is_content_user());

CREATE POLICY content_board_reactions_insert ON public.content_board_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_content_user());

CREATE POLICY content_board_reactions_delete ON public.content_board_reactions
  FOR DELETE
  USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- STORAGE BUCKET POLICY (run after creating the bucket in the dashboard)
--
-- In Supabase Dashboard → Storage → content-assets → Policies, add:
--
-- INSERT policy:
--   Name: content_team_can_upload
--   Roles: authenticated
--   USING: (SELECT role::text IN ('admin','content_manager') FROM public.users WHERE id = auth.uid())
--
-- SELECT policy (public read since bucket is public):
--   Name: public_read
--   Roles: anon, authenticated
--   USING: true
-- ---------------------------------------------------------------------------


-- =============================================================================
-- END OF 008_content_hub_rls.sql
-- =============================================================================
