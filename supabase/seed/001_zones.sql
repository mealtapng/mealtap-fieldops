-- =============================================================================
-- Mealtap Field Ops — seed/001_zones.sql
-- Seeds the five Abuja operational zones used by field agents.
--
-- HOW TO RUN:
--   1. Make sure you have already run (in order):
--        001_initial_schema.sql
--        002_rls_policies.sql
--        003_zones_geo_columns.sql   ← required for label/center_lat/center_lng/radius_km
--   2. Open Supabase → SQL Editor → New query
--   3. Paste this entire file and click Run
--
-- IDEMPOTENT: Uses ON CONFLICT (name) DO NOTHING, so re-running is safe.
--   Existing rows are left untouched. Add new zones below the existing inserts
--   and re-run to add them without duplicating existing ones.
-- =============================================================================

INSERT INTO public.zones (name, label, center_lat, center_lng, radius_km)
VALUES
  ('Wuse 2',       'Wuse 2',       9.0765, 7.4851, 2.0),
  ('Garki',        'Garki',        9.0336, 7.4892, 2.5),
  ('Maitama',      'Maitama',      9.0892, 7.4951, 2.5),
  ('Central Area', 'Central Area', 9.0579, 7.4951, 2.0),
  ('Asokoro',      'Asokoro',      9.0425, 7.5303, 2.5)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERY
-- Run immediately after the INSERT to confirm all 5 rows exist.
--
-- Expected output (order may vary):
--   name           | label         | center_lat | center_lng | radius_km
--   ---------------+---------------+------------+------------+-----------
--   Asokoro        | Asokoro       |     9.0425 |     7.5303 |      2.50
--   Central Area   | Central Area  |     9.0579 |     7.4951 |      2.00
--   Garki          | Garki         |     9.0336 |     7.4892 |      2.50
--   Maitama        | Maitama       |     9.0892 |     7.4951 |      2.50
--   Wuse 2         | Wuse 2        |     9.0765 |     7.4851 |      2.00
-- =============================================================================

SELECT name, label, center_lat, center_lng, radius_km
FROM public.zones
ORDER BY name;
