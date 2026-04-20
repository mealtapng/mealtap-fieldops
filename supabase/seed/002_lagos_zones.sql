-- =============================================================================
-- PowerChat Field Ops — seed/002_lagos_zones.sql
-- Seeds Lagos operational zones for PowerChat field agents.
--
-- HOW TO RUN:
--   1. Make sure you have already run (in order):
--        003_powerchat_schema.sql
--        004_powerchat_rls.sql
--        seed/001_zones.sql  (Abuja zones)
--   2. Open Supabase → SQL Editor → New query
--   3. Paste this entire file and click Run
--
-- IDEMPOTENT: Uses ON CONFLICT (name) DO NOTHING, so re-running is safe.
-- =============================================================================

INSERT INTO public.zones (name, label, center_lat, center_lng, radius_km)
VALUES
  ('Ikeja',         'Ikeja',         6.6018, 3.3515, 3.0),
  ('Surulere',      'Surulere',      6.5059, 3.3509, 2.5),
  ('Yaba',          'Yaba',          6.5158, 3.3750, 2.0),
  ('Lekki Phase 1', 'Lekki Phase 1', 6.4467, 3.4750, 3.0),
  ('Ajah',          'Ajah',          6.4698, 3.5852, 3.5)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERY
-- Expected: 5 new Lagos rows alongside the existing Abuja rows.
-- =============================================================================

SELECT name, label, center_lat, center_lng, radius_km
FROM public.zones
ORDER BY name;
