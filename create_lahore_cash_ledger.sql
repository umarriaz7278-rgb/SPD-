-- Run this in Supabase SQL Editor to create the Lahore Cash Ledger table

CREATE TABLE IF NOT EXISTS lahore_cash_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL, -- 'Income' or 'Expense'
  amount NUMERIC DEFAULT 0,
  description TEXT,
  record_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE lahore_cash_ledger ENABLE ROW LEVEL SECURITY;

-- Create open policies
CREATE POLICY "Allow all select for lahore_cash_ledger" ON lahore_cash_ledger FOR SELECT USING (true);
CREATE POLICY "Allow all insert for lahore_cash_ledger" ON lahore_cash_ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update for lahore_cash_ledger" ON lahore_cash_ledger FOR UPDATE USING (true);
CREATE POLICY "Allow all delete for lahore_cash_ledger" ON lahore_cash_ledger FOR DELETE USING (true);

SELECT 'Lahore Cash Ledger table created successfully!' AS result;
