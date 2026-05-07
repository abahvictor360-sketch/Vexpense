-- ============================================================
-- Vexpense — Combined Migration (run this in Supabase SQL Editor)
-- https://supabase.com/dashboard/project/snukxbocrgjteqvcoffi/editor
-- ============================================================

-- 001: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 002: Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT,
  avatar_color   TEXT DEFAULT '#534AB7',
  country_code   CHAR(2) DEFAULT 'NG',
  country_name   TEXT DEFAULT 'Nigeria',
  currency       CHAR(3) DEFAULT 'NGN',
  monthly_income NUMERIC(12,2) DEFAULT 0,
  onboarding_done BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 003: Categories
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '💰',
  color      TEXT NOT NULL DEFAULT '#534AB7',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories (name, icon, color, is_default, user_id)
SELECT name, icon, color, is_default, user_id FROM (VALUES
  ('Food & Drinks',    '🍔', '#f97316', true, NULL),
  ('Transport',        '🚗', '#3b82f6', true, NULL),
  ('Rent & Bills',     '🏠', '#8b5cf6', true, NULL),
  ('Entertainment',    '🎬', '#ec4899', true, NULL),
  ('Shopping',         '🛍️', '#f59e0b', true, NULL),
  ('Health',           '❤️', '#ef4444', true, NULL),
  ('Education',        '📚', '#6366f1', true, NULL),
  ('Savings',          '💰', '#10b981', true, NULL),
  ('Subscriptions',    '📱', '#14b8a6', true, NULL),
  ('Other',            '📦', '#9ca3af', true, NULL)
) AS v(name, icon, color, is_default, user_id)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE is_default = true LIMIT 1);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read default and own categories" ON categories;
DROP POLICY IF EXISTS "Insert own categories" ON categories;
DROP POLICY IF EXISTS "Update own categories" ON categories;
DROP POLICY IF EXISTS "Delete own categories" ON categories;
CREATE POLICY "Read default and own categories" ON categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Insert own categories"           ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own categories"           ON categories FOR UPDATE USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Delete own categories"           ON categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- 004: Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description    TEXT NOT NULL DEFAULT '',
  notes          TEXT,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  receipt_url    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx     ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_category_idx ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS expenses_desc_trgm_idx     ON expenses USING gin(description gin_trgm_ops);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
CREATE POLICY "Users manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- 005: Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, category_id, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own budgets" ON budgets;
CREATE POLICY "Users manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- 006: Goals & Contributions
CREATE TABLE IF NOT EXISTS goals (
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

CREATE TABLE IF NOT EXISTS goal_contributions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note       TEXT,
  date       DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION sync_goal_saved_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_total  NUMERIC(12,2);
  v_target NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total  FROM goal_contributions WHERE goal_id = NEW.goal_id;
  SELECT target_amount            INTO v_target  FROM goals              WHERE id      = NEW.goal_id;
  UPDATE goals SET
    saved_amount = v_total,
    status       = CASE WHEN v_total >= v_target THEN 'completed' ELSE status END,
    updated_at   = now()
  WHERE id = NEW.goal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_contribution_added ON goal_contributions;
CREATE TRIGGER on_contribution_added
  AFTER INSERT ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION sync_goal_saved_amount();

ALTER TABLE goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own goals"         ON goals;
DROP POLICY IF EXISTS "Users manage own contributions" ON goal_contributions;
CREATE POLICY "Users manage own goals"         ON goals             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own contributions" ON goal_contributions FOR ALL USING (auth.uid() = user_id);

-- 007: AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conv_user_created_idx ON ai_conversations(user_id, created_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own conversations" ON ai_conversations;
CREATE POLICY "Users manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ✅ Done! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
