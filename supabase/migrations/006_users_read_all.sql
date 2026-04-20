-- =============================================================================
-- Mealtap Field Ops — 006_users_read_all.sql
-- Allow any authenticated user to read any user's basic profile.
-- Required for: board post author display, DM thread participant names.
-- The previous policy only allowed agents to see their own row, which broke
-- foreign key joins in server queries.
-- =============================================================================

DROP POLICY IF EXISTS users_self_read ON public.users;

CREATE POLICY users_self_read ON public.users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
