-- ===================================================
-- FIX: Add missing 'amount' column to party_ledger_entries
-- Run this in Supabase SQL Editor
-- ===================================================

-- 1. Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS party_ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES party_accounts(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  type TEXT DEFAULT 'debit',
  amount NUMERIC DEFAULT 0,
  invoice_id UUID,
  payment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns if table exists but columns are missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='amount') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='type') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN type TEXT DEFAULT 'debit';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='invoice_id') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN invoice_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='payment_type') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN payment_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='description') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='date') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_ledger_entries' AND column_name='party_id') THEN
    ALTER TABLE party_ledger_entries ADD COLUMN party_id UUID REFERENCES party_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE party_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Allow all for anon key)
DO $$ 
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow all select for party_ledger_entries" ON party_ledger_entries';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all insert for party_ledger_entries" ON party_ledger_entries';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all update for party_ledger_entries" ON party_ledger_entries';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all delete for party_ledger_entries" ON party_ledger_entries';
  
  EXECUTE 'CREATE POLICY "Allow all select for party_ledger_entries" ON party_ledger_entries FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow all insert for party_ledger_entries" ON party_ledger_entries FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow all update for party_ledger_entries" ON party_ledger_entries FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow all delete for party_ledger_entries" ON party_ledger_entries FOR DELETE USING (true)';
END $$;

SELECT 'party_ledger_entries table fixed successfully!' AS result;
