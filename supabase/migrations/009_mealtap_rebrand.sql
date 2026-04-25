-- Migration 009: Mealtap rebrand — restaurants, restaurant_photos, user bank fields
-- Run after 008_content_hub_rls.sql

-- ── PostGIS (idempotent) ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Restaurants table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text        NOT NULL,
  owner_name                  text        NOT NULL,
  owner_phone                 text        NOT NULL,
  address                     text,
  lat                         double precision NOT NULL,
  lng                         double precision NOT NULL,
  gps_accuracy_m              double precision,
  location                    geography(Point, 4326),
  cuisine_type                text,
  avg_meal_price_naira        numeric,
  daily_order_volume_estimate integer,
  currently_delivers          boolean     NOT NULL DEFAULT false,
  delivery_method             text,
  has_smartphone              boolean     NOT NULL DEFAULT false,
  has_bank_account            boolean     NOT NULL DEFAULT false,
  has_pos                     boolean     NOT NULL DEFAULT false,
  owner_reaction              integer     CHECK (owner_reaction BETWEEN 1 AND 5),
  tag                         text        NOT NULL DEFAULT 'warm'
                                           CHECK (tag IN ('hot','warm','cold','not_a_fit')),
  notes                       text,
  captured_by                 uuid        NOT NULL REFERENCES users(id),
  zone_id                     uuid        REFERENCES zones(id) ON DELETE SET NULL,
  quality_score               numeric,
  quality_flags               text[],
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurants_captured_by_idx ON restaurants(captured_by);
CREATE INDEX IF NOT EXISTS restaurants_zone_id_idx     ON restaurants(zone_id);
CREATE INDEX IF NOT EXISTS restaurants_tag_idx         ON restaurants(tag);
CREATE INDEX IF NOT EXISTS restaurants_created_at_idx  ON restaurants(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_restaurants_updated_at ON restaurants;
CREATE TRIGGER set_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Restaurant photos table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant_photos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  photo_type    text        NOT NULL CHECK (photo_type IN ('storefront','menu','dish','owner')),
  storage_path  text        NOT NULL,
  uploaded_by   uuid        NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_photos_restaurant_id_idx ON restaurant_photos(restaurant_id);

-- ── Add bank fields to users ──────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS account_name   text;

-- ── RLS: restaurants ─────────────────────────────────────────────────────────
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Agents can see + insert their own captures
CREATE POLICY restaurants_agent_select ON restaurants
  FOR SELECT TO authenticated
  USING (captured_by = auth.uid());

CREATE POLICY restaurants_agent_insert ON restaurants
  FOR INSERT TO authenticated
  WITH CHECK (captured_by = auth.uid());

-- Admins and field leads can see all
CREATE POLICY restaurants_admin_select ON restaurants
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'field_lead')
  );

CREATE POLICY restaurants_admin_all ON restaurants
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── RLS: restaurant_photos ────────────────────────────────────────────────────
ALTER TABLE restaurant_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY restaurant_photos_agent_select ON restaurant_photos
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY restaurant_photos_agent_insert ON restaurant_photos
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY restaurant_photos_admin_all ON restaurant_photos
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'field_lead')
  );
