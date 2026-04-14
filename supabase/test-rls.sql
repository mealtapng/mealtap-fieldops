-- =============================================================================
-- Mealtap Field Ops — test-rls.sql
-- RLS verification queries. Paste into Supabase SQL Editor and run each
-- section independently (or run all at once — each is a SELECT, no mutations).
--
-- These queries are READ-ONLY. They inspect Postgres system catalogs only.
-- Safe to run at any time against the live database.
-- =============================================================================


-- =============================================================================
-- SECTION 1: RLS ENABLED STATUS
-- -----------------------------------------------------------------------------
-- Checks which tables have Row Level Security turned on.
--
-- EXPECTED OUTPUT:
--   tablename              | rls_enabled
--   -----------------------+-------------
--   board_posts            | true         ← protected
--   dm_messages            | true         ← protected
--   dm_threads             | true         ← protected
--   restaurant_photos      | true         ← protected
--   restaurants            | true         ← protected
--   users                  | true         ← protected
--   board_reactions        | false        ← intentional: access via board_posts
--   capture_events         | false        ← intentional: append-only audit log
--   zones                  | false        ← intentional: public lookup table
--
-- If any of the first 6 rows shows false, re-run 002_rls_policies.sql.
-- =============================================================================

SELECT
  c.relname                          AS tablename,
  c.relrowsecurity                   AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'users', 'restaurants', 'restaurant_photos',
    'board_posts', 'dm_threads', 'dm_messages',
    'zones', 'board_reactions', 'capture_events'
  )
ORDER BY rls_enabled DESC, tablename;


-- =============================================================================
-- SECTION 2: HELPER FUNCTION EXISTS
-- -----------------------------------------------------------------------------
-- Confirms that public.get_my_role() was created. This function is used by
-- every policy that checks admin/field_lead access.
--
-- EXPECTED OUTPUT: 1 row with routine_name = 'get_my_role'
-- If 0 rows: re-run the CREATE OR REPLACE FUNCTION block from 002_rls_policies.sql
-- =============================================================================

SELECT
  routine_schema,
  routine_name,
  security_type   -- should be 'DEFINER'
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_my_role';


-- =============================================================================
-- SECTION 3: ALL POLICIES — FULL SUMMARY
-- -----------------------------------------------------------------------------
-- Lists every RLS policy in the public schema.
--
-- EXPECTED: 14 rows total —
--   users (2) + restaurants (3) + restaurant_photos (2) +
--   board_posts (3) + dm_threads (2) + dm_messages (2)
--
-- Columns:
--   tablename   — which table the policy applies to
--   policyname  — policy identifier
--   cmd         — operation: SELECT | INSERT | UPDATE | DELETE | ALL
--   permissive  — PERMISSIVE (rows pass if ANY permissive policy matches)
--   qual        — USING expression (filters rows on SELECT/UPDATE/DELETE)
--   with_check  — WITH CHECK expression (validates rows on INSERT/UPDATE)
-- =============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- =============================================================================
-- SECTION 4: PER-TABLE POLICY DETAIL
-- Run each block separately to get a clean result per table.
-- =============================================================================

-- ── users ────────────────────────────────────────────────────────────────────
-- EXPECTED: 2 policies
--   users_self_read   → SELECT  — agent sees own row; admin/field_lead see all
--   users_admin_update → UPDATE — only admin/field_lead can update
-- Note: no INSERT policy — users are created via Supabase Auth + a DB trigger,
--   not via direct INSERT from the client app. Add one if you allow self-signup.

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;


-- ── restaurants ──────────────────────────────────────────────────────────────
-- EXPECTED: 3 policies
--   restaurants_read   → SELECT — agent sees own captures; admin/lead see all
--   restaurants_insert → INSERT — captured_by must equal the caller's uid
--   restaurants_update → UPDATE — agent updates own; admin/lead update all
-- Note: no DELETE policy — deletions are intentionally blocked until A-team
--   decides on a soft-delete vs hard-delete strategy.

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'restaurants'
ORDER BY cmd, policyname;


-- ── restaurant_photos ────────────────────────────────────────────────────────
-- EXPECTED: 2 policies
--   restaurant_photos_read   → SELECT — inherits parent restaurant access
--   restaurant_photos_insert → INSERT — uploader must own the parent restaurant

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'restaurant_photos'
ORDER BY cmd, policyname;


-- ── board_posts ──────────────────────────────────────────────────────────────
-- EXPECTED: 3 policies
--   board_posts_read   → SELECT — any authenticated user can read
--   board_posts_write  → INSERT — only admin/field_lead can post
--   board_posts_update → UPDATE — only the author or an admin can edit

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'board_posts'
ORDER BY cmd, policyname;


-- ── dm_threads ───────────────────────────────────────────────────────────────
-- EXPECTED: 2 policies
--   dm_threads_read   → SELECT — only the agent or supervisor party
--   dm_threads_insert → INSERT — creator must be one of the two parties

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'dm_threads'
ORDER BY cmd, policyname;


-- ── dm_messages ──────────────────────────────────────────────────────────────
-- EXPECTED: 2 policies
--   dm_messages_read  → SELECT — only parties in the parent thread
--   dm_messages_write → INSERT — sender must be a party and identify correctly

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'dm_messages'
ORDER BY cmd, policyname;


-- =============================================================================
-- SECTION 5: GAP CHECK — TABLES WITH RLS DISABLED
-- -----------------------------------------------------------------------------
-- Lists every user table in the public schema that does NOT have RLS enabled.
-- Run this after any new migration to catch tables that forgot to enable RLS.
--
-- EXPECTED RIGHT NOW: 3 rows — zones, board_reactions, capture_events
-- These are intentionally unprotected (see notes above).
-- Any unexpected table appearing here should be investigated.
-- =============================================================================

SELECT
  c.relname AS unprotected_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY c.relname;


-- =============================================================================
-- SECTION 6: POLICY COUNT ASSERTION
-- -----------------------------------------------------------------------------
-- Quick sanity check — total policy count should be exactly 14.
-- If count < 14, some policies from 002_rls_policies.sql failed to apply.
-- If count > 14, there are unexpected extra policies (possibly from a partial
-- re-run of the migration).
-- =============================================================================

SELECT
  COUNT(*)                                   AS total_policies,
  COUNT(*) = 14                              AS count_is_correct,
  COUNT(*) FILTER (WHERE cmd = 'SELECT')     AS select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT')     AS insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE')     AS update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE')     AS delete_policies
FROM pg_policies
WHERE schemaname = 'public';

-- Expected breakdown:
--   total_policies  = 14
--   count_is_correct = true
--   select_policies  = 6   (one per protected table)
--   insert_policies  = 5   (restaurants, restaurant_photos, board_posts, dm_threads, dm_messages)
--   update_policies  = 3   (users, restaurants, board_posts)
--   delete_policies  = 0   ← no DELETE policies yet (intentional)

-- =============================================================================
-- END OF test-rls.sql
-- =============================================================================
