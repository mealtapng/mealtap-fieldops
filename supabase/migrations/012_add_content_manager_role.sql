-- =============================================================================
-- 012_add_content_manager_role.sql
--
-- Adds 'content_manager' to the user_role enum if it doesn't already exist.
-- Safe to re-run — the EXCEPTION block silently skips if already present.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE 'content_manager';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
