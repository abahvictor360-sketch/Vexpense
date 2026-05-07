-- Expenses
CREATE TABLE expenses (
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

-- Indexes for common queries
CREATE INDEX expenses_user_date_idx ON expenses(user_id, date DESC);
CREATE INDEX expenses_user_category_idx ON expenses(user_id, category_id);
CREATE INDEX expenses_desc_trgm_idx ON expenses USING gin(description gin_trgm_ops);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id);
