-- =============================================================================
-- PowerChat Field Ops — 007_content_hub_schema.sql
--
-- Content Hub tables for the social media team.
-- Run AFTER 004_powerchat_rls.sql.
--
-- Steps:
--   1. Run this file in the Supabase SQL Editor.
--   2. Run 008_content_hub_rls.sql.
--   3. Create the 'content-assets' Storage bucket (Public: ON) in the dashboard.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTEND user_role ENUM
-- PostgreSQL requires this outside a transaction on some versions.
-- The IF NOT EXISTS guard makes it safe to re-run.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE 'content_manager';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ---------------------------------------------------------------------------
-- TABLE: content_weeks
-- One row per content week. Admin creates these; content managers read them.
-- ---------------------------------------------------------------------------

CREATE TABLE public.content_weeks (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number           integer     NOT NULL,
  start_date            date        NOT NULL,
  end_date              date        NOT NULL,
  title                 text        NOT NULL,
  general_instructions  text,
  status                text        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'active', 'completed')),
  created_by            uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_content_weeks_updated_at
  BEFORE UPDATE ON public.content_weeks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_content_weeks_status ON public.content_weeks(status);
CREATE INDEX idx_content_weeks_start  ON public.content_weeks(start_date);


-- ---------------------------------------------------------------------------
-- TABLE: content_assets
-- Individual content pieces (images, videos, graphics) inside a week.
-- ---------------------------------------------------------------------------

CREATE TABLE public.content_assets (
  id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id              uuid        NOT NULL REFERENCES public.content_weeks(id) ON DELETE CASCADE,
  day_of_week          text        NOT NULL
                         CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  title                text        NOT NULL,
  description          text,
  file_url             text        NOT NULL,
  file_type            text        NOT NULL
                         CHECK (file_type IN ('image','video','document','graphic')),
  thumbnail_url        text,
  caption_instagram    text,
  caption_tiktok       text,
  caption_facebook     text,
  caption_x            text,
  caption_linkedin     text,
  hashtags             text,
  status               text        NOT NULL DEFAULT 'uploaded'
                         CHECK (status IN ('uploaded','reviewed','approved','posted')),
  posted_by            uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  posted_at            timestamptz,
  uploaded_by          uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  sort_order           integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_content_assets_updated_at
  BEFORE UPDATE ON public.content_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_content_assets_week    ON public.content_assets(week_id);
CREATE INDEX idx_content_assets_day     ON public.content_assets(week_id, day_of_week);
CREATE INDEX idx_content_assets_status  ON public.content_assets(status);


-- ---------------------------------------------------------------------------
-- TABLE: content_board_posts
-- Separate message board for the content team (NOT the field ops board).
-- ---------------------------------------------------------------------------

CREATE TABLE public.content_board_posts (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  body       text        NOT NULL,
  is_pinned  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_board_posts_pinned ON public.content_board_posts(is_pinned, created_at DESC);


-- ---------------------------------------------------------------------------
-- TABLE: content_board_reactions
-- Emoji reactions on content board posts.
-- ---------------------------------------------------------------------------

CREATE TABLE public.content_board_reactions (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    uuid        NOT NULL REFERENCES public.content_board_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);


-- =============================================================================
-- END OF 007_content_hub_schema.sql
-- Run 008_content_hub_rls.sql next.
-- Then create the 'content-assets' Supabase Storage bucket (Public: ON).
-- =============================================================================
