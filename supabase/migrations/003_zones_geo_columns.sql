-- =============================================================================
-- Mealtap Field Ops — 003_zones_geo_columns.sql
-- Adds geographic and display columns to the zones table.
--
-- Run this BEFORE 001_zones.sql (the seed file).
-- Run it AFTER 001_initial_schema.sql and 002_rls_policies.sql.
--
-- Safe to re-run:
--   - ADD COLUMN IF NOT EXISTS is idempotent.
--   - The UNIQUE constraint will error on a second run — that is harmless;
--     it just means the constraint already exists.
-- =============================================================================

-- Add the missing columns.
-- label:      display name shown in the UI (same value as name initially)
-- center_lat: approximate latitude of the zone's geographic centre
-- center_lng: approximate longitude of the zone's geographic centre
-- radius_km:  approximate radius of the zone in kilometres

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS label      text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS center_lat double precision,
  ADD COLUMN IF NOT EXISTS center_lng double precision,
  ADD COLUMN IF NOT EXISTS radius_km  numeric(5, 2);

-- Add a unique constraint on name so that the seed script can use
-- ON CONFLICT (name) DO NOTHING for idempotent inserts.
ALTER TABLE public.zones
  ADD CONSTRAINT zones_name_unique UNIQUE (name);

-- =============================================================================
-- Verify: run this after applying the migration.
-- Expected: 4 new columns appear alongside id, description, created_at.
-- =============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'zones'
ORDER BY ordinal_position;
