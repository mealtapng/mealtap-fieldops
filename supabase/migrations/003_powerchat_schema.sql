-- =============================================================================
-- PowerChat Field Ops — 003_powerchat_schema.sql
--
-- FULL SCHEMA for a fresh PowerChat Supabase project.
-- Run this FIRST in the Supabase SQL Editor on a brand-new database.
--
-- Prerequisites (enable in Supabase → Database → Extensions before running):
--   • uuid-ossp   → for uuid_generate_v4()
--   • postgis     → for geography(Point, 4326)
--
-- This file is a consolidated replacement for the old Mealtap migrations
-- 001–006. Do NOT run the old files alongside this one.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONS (idempotent)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";


-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'agent',
  'field_lead',
  'admin'
);

CREATE TYPE public.conversion_status AS ENUM (
  'pending',
  'converted',
  'failed'
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
-- Geographic clusters used to group agents and onboardings.
-- ---------------------------------------------------------------------------

CREATE TABLE public.zones (
  id          uuid             PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text             NOT NULL UNIQUE,
  label       text             NOT NULL DEFAULT '',
  center_lat  double precision,
  center_lng  double precision,
  radius_km   numeric(5,2)     DEFAULT 2.0,
  created_at  timestamptz      NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- TABLE 2: users
-- Agents, field leads, and admins. Auth identity comes from Supabase Auth;
-- this table extends it with operational profile data.
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id                   uuid             PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone                text             NOT NULL UNIQUE,
  pin_hash             text             NOT NULL,
  role                 public.user_role NOT NULL DEFAULT 'agent',
  employee_id          text             NOT NULL UNIQUE,
  full_name            text             NOT NULL,
  passport_photo_url   text,
  email                text,
  date_of_birth        date,
  home_address         text,
  nin_last_4           char(4),
  next_of_kin_name     text,
  next_of_kin_phone    text,
  bank_name            text,
  bank_account_masked  text,
  assigned_zone_id     uuid             REFERENCES public.zones(id) ON DELETE SET NULL,
  referral_code        text             UNIQUE,
  start_date           date,
  is_active            boolean          NOT NULL DEFAULT true,
  quality_score        numeric(5,2)     DEFAULT 100,
  failed_attempts      smallint         NOT NULL DEFAULT 0,
  created_at           timestamptz      NOT NULL DEFAULT now(),
  updated_at           timestamptz      NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role  ON public.users(role);


-- ---------------------------------------------------------------------------
-- TABLE 3: onboardings
-- Core capture entity. Each row = one customer onboarded by an agent.
-- PostGIS geography column stores the precise GPS point.
-- ---------------------------------------------------------------------------

CREATE TABLE public.onboardings (
  id                        uuid                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_phone                text                     NOT NULL,
  user_name                 text                     NOT NULL,
  meter_number              text,
  disco_area                text                     NOT NULL,
  lat                       double precision         NOT NULL,
  lng                       double precision         NOT NULL,
  gps_accuracy_m            numeric(6,2),
  location                  geography(Point, 4326),
  address                   text,
  referral_code             text                     NOT NULL,
  conversion_status         public.conversion_status NOT NULL DEFAULT 'pending',
  checklist_saved_number    boolean                  DEFAULT false,
  checklist_sent_hi         boolean                  DEFAULT false,
  checklist_entered_code    boolean                  DEFAULT false,
  checklist_purchased_token boolean                  DEFAULT false,
  token_amount_purchased    integer,
  agent_id                  uuid                     NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  zone_id                   uuid                     REFERENCES public.zones(id) ON DELETE SET NULL,
  notes                     text,
  created_at                timestamptz              NOT NULL DEFAULT now(),
  updated_at                timestamptz              NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_onboardings_updated_at
  BEFORE UPDATE ON public.onboardings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_onboardings_agent    ON public.onboardings(agent_id);
CREATE INDEX idx_onboardings_zone     ON public.onboardings(zone_id);
CREATE INDEX idx_onboardings_status   ON public.onboardings(conversion_status);
CREATE INDEX idx_onboardings_location ON public.onboardings USING GIST (location);


-- ---------------------------------------------------------------------------
-- TABLE 4: board_posts
-- Team message board. Only field leads and admins can post; everyone can read.
-- ---------------------------------------------------------------------------

CREATE TABLE public.board_posts (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      text        NOT NULL,
  body       text        NOT NULL,
  posted_by  uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  is_pinned  boolean     NOT NULL DEFAULT false,
  post_type  text        NOT NULL DEFAULT 'announcement',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- TABLE 5: board_reactions
-- Emoji reactions on board posts. One reaction per (post, user, emoji).
-- ---------------------------------------------------------------------------

CREATE TABLE public.board_reactions (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    uuid        NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);


-- ---------------------------------------------------------------------------
-- TABLE 6: dm_threads
-- One thread per (agent, supervisor) pair.
-- ---------------------------------------------------------------------------

CREATE TABLE public.dm_threads (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supervisor_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, supervisor_id)
);


-- ---------------------------------------------------------------------------
-- TABLE 7: dm_messages
-- Individual messages inside a DM thread.
-- ---------------------------------------------------------------------------

CREATE TABLE public.dm_messages (
  id        uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid        NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  body      text        NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now(),
  read_at   timestamptz
);


-- =============================================================================
-- END OF 003_powerchat_schema.sql
-- Run 004_powerchat_rls.sql next.
-- =============================================================================
