-- ===================================================
-- CREATE PARTY ACCOUNTS & PARTY LEDGER ENTRIES TABLES
-- Run this in Supabase SQL Editor
-- ===================================================

-- 1. PARTY ACCOUNTS TABLE (stores party/customer info)
CREATE TABLE IF NOT EXISTS party_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT NOT NULL,
  contact_person TEXT,
  mobile_number TEXT,
  cnic TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PARTY LEDGER ENTRIES TABLE (stores all ledger transactions)
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

-- 3. ENABLE RLS
ALTER TABLE party_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Allow all for anon key - same as other tables)
DO $$ 
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['party_accounts','party_ledger_entries'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all select for %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert for %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update for %1$s" ON %1$s', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all delete for %1$s" ON %1$s', tbl);
    
    EXECUTE format('CREATE POLICY "Allow all select for %1$s" ON %1$s FOR SELECT USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all insert for %1$s" ON %1$s FOR INSERT WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all update for %1$s" ON %1$s FOR UPDATE USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all delete for %1$s" ON %1$s FOR DELETE USING (true)', tbl);
  END LOOP;
END $$;

SELECT 'Party Accounts tables created successfully!' AS result;
