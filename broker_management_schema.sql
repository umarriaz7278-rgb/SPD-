-- Broker Management Schema
-- Run this in Supabase SQL Editor

-- 1. Add broker_name to chalans table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chalans' AND column_name='broker_name') THEN
    ALTER TABLE chalans ADD COLUMN broker_name TEXT;
  END IF;
END $$;

-- 2. Create Brokers Table
CREATE TABLE IF NOT EXISTS brokers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Broker Ledger Table
CREATE TABLE IF NOT EXISTS broker_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  chalan_id UUID REFERENCES chalans(id) ON DELETE SET NULL,
  record_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  vehicle_no TEXT,
  route_permit_no TEXT,
  vehicle_fare NUMERIC DEFAULT 0,
  chalan_no TEXT,
  commission_amount NUMERIC DEFAULT 0,
  payment_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select for brokers" ON brokers FOR SELECT USING (true);
CREATE POLICY "Allow all insert for brokers" ON brokers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update for brokers" ON brokers FOR UPDATE USING (true);
CREATE POLICY "Allow all delete for brokers" ON brokers FOR DELETE USING (true);

CREATE POLICY "Allow all select for broker_ledger" ON broker_ledger FOR SELECT USING (true);
CREATE POLICY "Allow all insert for broker_ledger" ON broker_ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update for broker_ledger" ON broker_ledger FOR UPDATE USING (true);
CREATE POLICY "Allow all delete for broker_ledger" ON broker_ledger FOR DELETE USING (true);
