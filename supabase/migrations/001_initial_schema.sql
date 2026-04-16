-- =============================================================================
-- Mealtap Field Ops — 001_initial_schema.sql
-- Run this FIRST in the Supabase SQL Editor.
-- Prerequisites: uuid-ossp and PostGIS extensions must already be enabled.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'agent',
  'field_lead',
  'admin'
);

CREATE TYPE public.lead_tag AS ENUM (
  'hot',
  'warm',
  'cold',
  'not_a_fit'
);

CREATE TYPE public.delivery_method AS ENUM (
  'none',
  'calls',
  'whatsapp',
  'chowdeck',
  'glovo',
  'bolt',
  'other'
);

-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- Attach to any table that needs auto-managed updated_at.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TABLE 1: zones
-- Geographic clusters used to group agents and restaurants in Abuja.
-- ---------------------------------------------------------------------------

CREATE TABLE public.zones (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL UNIQUE,
  label       text,
  center_lat  double precision,
  center_lng  double precision,
  radius_km   numeric(5,2) DEFAULT 2.0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE 2: users
-- Agents, field leads, and admins. Auth identity comes from Supabase Auth;
-- this table extends it with operational profile data.
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone                text NOT NULL UNIQUE,
  pin_hash             text NOT NULL,
  role                 public.user_role NOT NULL DEFAULT 'agent',
  employee_id          text NOT NULL UNIQUE,
  full_name            text NOT NULL,
  passport_photo_url   text,
  email                text,
  date_of_birth        date,
  home_address         text,
  nin_last_4           char(4),
  next_of_kin_name     text,
  next_of_kin_phone    text,
  bank_name            text,
  bank_account_masked  text,
  assigned_zone_id     uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  start_date           date,
  is_active            boolean NOT NULL DEFAULT true,
  quality_score        numeric(4,2) DEFAULT 100,
  failed_attempts      smallint NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE 3: restaurants
-- Core capture entity. PostGIS geography column stores the precise GPS point.
-- ---------------------------------------------------------------------------

CREATE TABLE public.restaurants (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        text NOT NULL,
  owner_name                  text,
  owner_phone                 text,
  address                     text,
  lat                         double precision,
  lng                         double precision,
  gps_accuracy_m              numeric(6,2),
  location                    geography(Point, 4326),
  cuisine_type                text,
  avg_meal_price_naira        integer,
  daily_order_volume_estimate integer,
  currently_delivers          boolean,
  delivery_method             public.delivery_method NOT NULL DEFAULT 'none',
  has_smartphone              boolean,
  has_bank_account            boolean,
  has_pos                     boolean,
  owner_reaction              smallint CHECK (owner_reaction BETWEEN 1 AND 5),
  tag                         public.lead_tag,
  notes                       text,
  captured_by                 uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  zone_id                     uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  quality_score               numeric(4,2) DEFAULT 0,
  quality_flags               jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE 4: restaurant_photos
-- Storefront, menu, and dish photos linked to a restaurant capture.
-- Deleted automatically when the parent restaurant is deleted.
-- ---------------------------------------------------------------------------

CREATE TABLE public.restaurant_photos (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  photo_url     text NOT NULL,
  photo_type    text NOT NULL CHECK (photo_type IN ('storefront', 'menu', 'dish')),
  uploaded_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TABLE 5: board_posts
-- Team message board. Only field leads and admins can post; everyone can read.
-- ---------------------------------------------------------------------------

CREATE TABLE public.board_posts (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      text NOT NULL,
  body       text NOT NULL,
  posted_by  uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE 6: board_reactions
-- Emoji reactions on board posts. One reaction per (post, user, emoji).
-- Deleted automatically when the parent post is deleted.
-- ---------------------------------------------------------------------------

CREATE TABLE public.board_reactions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    uuid NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

-- ---------------------------------------------------------------------------
-- TABLE 7: dm_threads
-- One thread per (agent, supervisor) pair. Enforced by unique constraint.
-- ---------------------------------------------------------------------------

CREATE TABLE public.dm_threads (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supervisor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, supervisor_id)
);

-- ---------------------------------------------------------------------------
-- TABLE 8: dm_messages
-- Individual messages inside a DM thread.
-- Deleted automatically when the parent thread is deleted.
-- ---------------------------------------------------------------------------

CREATE TABLE public.dm_messages (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  body      text NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now(),
  read_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- TABLE 9: capture_events
-- Immutable audit log — one row per meaningful action on a restaurant record.
-- Deleted automatically when the parent restaurant is deleted.
-- ---------------------------------------------------------------------------

CREATE TABLE public.capture_events (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  captured_by   uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action        text NOT NULL,
  payload       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX idx_users_phone          ON public.users(phone);
CREATE INDEX idx_users_role           ON public.users(role);
CREATE INDEX idx_restaurants_captured_by ON public.restaurants(captured_by);
CREATE INDEX idx_restaurants_zone     ON public.restaurants(zone_id);
CREATE INDEX idx_restaurants_tag      ON public.restaurants(tag);
CREATE INDEX idx_restaurants_location ON public.restaurants USING GIST (location);

-- =============================================================================
-- END OF 001_initial_schema.sql
-- Verify: open Table Editor in Supabase — you should see all 9 tables.
-- Then run 002_rls_policies.sql.
-- =============================================================================
