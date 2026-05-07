-- Savings goals
CREATE TABLE goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  saved_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date    DATE,
  icon           TEXT DEFAULT '🎯',
  color          TEXT DEFAULT '#534AB7',
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Goal contributions
CREATE TABLE goal_contributions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note       TEXT,
  date       DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Keep saved_amount in sync with contributions
CREATE OR REPLACE FUNCTION sync_goal_saved_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC(12,2);
  v_target NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM goal_contributions
  WHERE goal_id = NEW.goal_id;

  SELECT target_amount INTO v_target
  FROM goals
  WHERE id = NEW.goal_id;

  UPDATE goals
  SET
    saved_amount = v_total,
    status = CASE WHEN v_total >= v_target THEN 'completed' ELSE status END,
    updated_at = now()
  WHERE id = NEW.goal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_contribution_added
  AFTER INSERT ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION sync_goal_saved_amount();

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own contributions" ON goal_contributions FOR ALL USING (auth.uid() = user_id);
