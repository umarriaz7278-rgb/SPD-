-- ===================================================
-- SUPER PAK DATA WALE - COMPLETE DATABASE SCHEMA
-- Run this ENTIRE script in Supabase SQL Editor
-- ===================================================

-- 1. BILTIES TABLE (Main Bilty Records)
CREATE TABLE IF NOT EXISTS bilties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bilty_no SERIAL UNIQUE,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  from_city TEXT NOT NULL DEFAULT 'Karachi',
  to_city TEXT NOT NULL DEFAULT 'Lahore',
  bilty_date DATE DEFAULT CURRENT_DATE,
  payment_status TEXT DEFAULT 'Advance Fare',
  party_name TEXT,
  local_karaya NUMERIC DEFAULT 0,
  loading_charges NUMERIC DEFAULT 0,
  total_quantity NUMERIC DEFAULT 0,
  remaining_quantity NUMERIC DEFAULT 0,
  total_weight NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Warehouse',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if bilties table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='from_city') THEN
    ALTER TABLE bilties ADD COLUMN from_city TEXT NOT NULL DEFAULT 'Karachi';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='to_city') THEN
    ALTER TABLE bilties ADD COLUMN to_city TEXT NOT NULL DEFAULT 'Lahore';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='bilty_date') THEN
    ALTER TABLE bilties ADD COLUMN bilty_date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='payment_status') THEN
    ALTER TABLE bilties ADD COLUMN payment_status TEXT DEFAULT 'Advance Fare';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='party_name') THEN
    ALTER TABLE bilties ADD COLUMN party_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='local_karaya') THEN
    ALTER TABLE bilties ADD COLUMN local_karaya NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='loading_charges') THEN
    ALTER TABLE bilties ADD COLUMN loading_charges NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='total_quantity') THEN
    ALTER TABLE bilties ADD COLUMN total_quantity NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='remaining_quantity') THEN
    ALTER TABLE bilties ADD COLUMN remaining_quantity NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='total_weight') THEN
    ALTER TABLE bilties ADD COLUMN total_weight NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='total_amount') THEN
    ALTER TABLE bilties ADD COLUMN total_amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='status') THEN
    ALTER TABLE bilties ADD COLUMN status TEXT DEFAULT 'Warehouse';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='sender_name') THEN
    ALTER TABLE bilties ADD COLUMN sender_name TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='sender_phone') THEN
    ALTER TABLE bilties ADD COLUMN sender_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='receiver_name') THEN
    ALTER TABLE bilties ADD COLUMN receiver_name TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='receiver_phone') THEN
    ALTER TABLE bilties ADD COLUMN receiver_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='lahore_quantity') THEN
    ALTER TABLE bilties ADD COLUMN lahore_quantity NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='created_at') THEN
    ALTER TABLE bilties ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;


-- Add missing columns to chalan_bilties
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chalan_bilties' AND column_name='received_quantity') THEN
    ALTER TABLE chalan_bilties ADD COLUMN received_quantity NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chalan_bilties' AND column_name='status') THEN
    ALTER TABLE chalan_bilties ADD COLUMN status TEXT DEFAULT 'Transit';
  END IF;
END $$;


-- Add missing columns to claims and handle amount rename
DO $$ 
BEGIN
  -- Check and rename amount to claim_amount if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='amount') THEN
    ALTER TABLE claims RENAME COLUMN amount TO claim_amount;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='claim_amount') THEN
    ALTER TABLE claims ADD COLUMN claim_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='truck_no') THEN
    ALTER TABLE claims ADD COLUMN truck_no TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='chalan_id') THEN
    ALTER TABLE claims ADD COLUMN chalan_id UUID REFERENCES chalans(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='missing_quantity') THEN
    ALTER TABLE claims ADD COLUMN missing_quantity NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='claims' AND column_name='claim_date') THEN
    ALTER TABLE claims ADD COLUMN claim_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;


-- 2. BILTY ITEMS TABLE (Goods in each bilty)
CREATE TABLE IF NOT EXISTS bilty_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bilty_id UUID REFERENCES bilties(id) ON DELETE CASCADE,
  goods_bayan TEXT,
  quantity NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  cbm NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 3. CHALANS TABLE
CREATE TABLE IF NOT EXISTS chalans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chalan_no SERIAL UNIQUE,
  truck_no TEXT,
  route_permit_no TEXT,
  departure_time TEXT,
  from_city TEXT DEFAULT 'Karachi',
  to_city TEXT DEFAULT 'Lahore',
  driver_phone TEXT,
  chalan_date DATE DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  labour_cost NUMERIC DEFAULT 0,
  vehicle_expense NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 4. CHALAN BILTIES (link table)
CREATE TABLE IF NOT EXISTS chalan_bilties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chalan_id UUID REFERENCES chalans(id) ON DELETE CASCADE,
  bilty_id UUID REFERENCES bilties(id) ON DELETE CASCADE,
  loaded_quantity NUMERIC DEFAULT 0,
  received_quantity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Transit',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 5. CASH LEDGER
CREATE TABLE IF NOT EXISTS cash_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT,
  amount NUMERIC DEFAULT 0,
  source_description TEXT,
  ref_id TEXT,
  record_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 6. PARTY LEDGER
CREATE TABLE IF NOT EXISTS party_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT,
  bilty_id UUID REFERENCES bilties(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  record_date DATE DEFAULT CURRENT_DATE,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 7. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bilty_id UUID REFERENCES bilties(id) ON DELETE SET NULL,
  chalan_id UUID REFERENCES chalans(id) ON DELETE CASCADE,
  truck_no TEXT,
  claim_date DATE DEFAULT CURRENT_DATE,
  claim_type TEXT,
  description TEXT,
  missing_quantity NUMERIC DEFAULT 0,
  claim_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 8. DELIVERY LOGS
CREATE TABLE IF NOT EXISTS delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bilty_id UUID REFERENCES bilties(id) ON DELETE CASCADE,
  chalan_id UUID,
  received_by TEXT,
  receiver_phone TEXT,
  delivery_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ===================================================
-- RLS POLICIES (Allow all operations for anon key)
-- ===================================================
ALTER TABLE bilties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilty_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chalans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chalan_bilties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DO $$ 
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['bilties','bilty_items','chalans','chalan_bilties','cash_ledger','party_ledger','claims','delivery_logs'];
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


-- Done! All tables and policies created/updated successfully.
SELECT 'Schema setup completed successfully!' AS result;
