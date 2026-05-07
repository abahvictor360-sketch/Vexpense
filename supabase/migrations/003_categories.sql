-- Expense categories
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '💰',
  color      TEXT NOT NULL DEFAULT '#534AB7',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Default categories (user_id = NULL means global defaults)
INSERT INTO categories (name, icon, color, is_default, user_id) VALUES
  ('Food & Drinks',    '🍔', '#f97316', true, NULL),
  ('Transport',        '🚗', '#3b82f6', true, NULL),
  ('Rent & Bills',     '🏠', '#8b5cf6', true, NULL),
  ('Entertainment',    '🎬', '#ec4899', true, NULL),
  ('Shopping',         '🛍️', '#f59e0b', true, NULL),
  ('Health',           '❤️', '#ef4444', true, NULL),
  ('Education',        '📚', '#6366f1', true, NULL),
  ('Savings',          '💰', '#10b981', true, NULL),
  ('Subscriptions',    '📱', '#14b8a6', true, NULL),
  ('Other',            '📦', '#9ca3af', true, NULL);

-- RLS: users see global defaults + their own custom categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read default and own categories"
  ON categories FOR SELECT
  USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);
