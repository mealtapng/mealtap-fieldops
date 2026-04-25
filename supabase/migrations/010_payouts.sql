-- Migration 010: Payouts tables
-- Run after 009_mealtap_rebrand.sql

-- ── Payouts table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              uuid        NOT NULL REFERENCES users(id),
  period_start          timestamptz NOT NULL,
  period_end            timestamptz NOT NULL,
  total_captures        integer     NOT NULL DEFAULT 0,
  total_hot_leads       integer     NOT NULL DEFAULT 0,
  salary_amount         numeric     NOT NULL DEFAULT 0,
  hot_lead_bonus_amount numeric     NOT NULL DEFAULT 0,
  deductions            numeric     NOT NULL DEFAULT 0,
  net_amount            numeric     NOT NULL,
  status                text        NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending','processing','paid')),
  paid_at               timestamptz,
  paid_by               uuid        REFERENCES users(id),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_agent_id_idx    ON payouts(agent_id);
CREATE INDEX IF NOT EXISTS payouts_status_idx      ON payouts(status);
CREATE INDEX IF NOT EXISTS payouts_period_start_idx ON payouts(period_start DESC);

-- Prevent duplicate paid payouts for same agent + period
CREATE UNIQUE INDEX IF NOT EXISTS payouts_unique_paid
  ON payouts(agent_id, period_start)
  WHERE status = 'paid';

DROP TRIGGER IF EXISTS set_payouts_updated_at ON payouts;
CREATE TRIGGER set_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Payout items table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id     uuid        NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  restaurant_id uuid        REFERENCES restaurants(id) ON DELETE SET NULL,
  item_type     text        NOT NULL CHECK (item_type IN ('capture','hot_lead','salary')),
  amount        numeric     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payout_items_payout_id_idx ON payout_items(payout_id);

-- ── RLS: payouts ──────────────────────────────────────────────────────────────
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Agents can view their own payouts
CREATE POLICY payouts_agent_select ON payouts
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid());

-- Admins can do everything
CREATE POLICY payouts_admin_all ON payouts
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── RLS: payout_items ────────────────────────────────────────────────────────
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY payout_items_agent_select ON payout_items
  FOR SELECT TO authenticated
  USING (
    (SELECT agent_id FROM payouts WHERE id = payout_id) = auth.uid()
  );

CREATE POLICY payout_items_admin_all ON payout_items
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
