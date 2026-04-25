-- Migration 011: App settings table
-- Run after 010_payouts.sql

-- ── App settings table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  updated_by uuid        REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY app_settings_read_all ON app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can write
CREATE POLICY app_settings_admin_write ON app_settings
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── Seed defaults ─────────────────────────────────────────────────────────────
INSERT INTO app_settings (key, value)
VALUES
  ('daily_target',   '20'),
  ('weekly_salary',  '40000'),
  ('hot_lead_bonus', '500')
ON CONFLICT (key) DO NOTHING;
