-- Run this in Supabase SQL Editor to create/fix delivery_logs table

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bilty_id UUID REFERENCES bilties(id) ON DELETE CASCADE,
    receiver_name TEXT,
    receiver_phone TEXT,
    receiver_cnic TEXT,
    delivered_quantity NUMERIC NOT NULL DEFAULT 0,
    delivery_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Step 2: Add any missing columns (safe to run even if columns already exist)

-- Add receiver_name column (if table has received_by instead)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='receiver_name') THEN
    ALTER TABLE delivery_logs ADD COLUMN receiver_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='receiver_cnic') THEN
    ALTER TABLE delivery_logs ADD COLUMN receiver_cnic TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='delivered_quantity') THEN
    ALTER TABLE delivery_logs ADD COLUMN delivered_quantity NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='receiver_phone') THEN
    ALTER TABLE delivery_logs ADD COLUMN receiver_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='delivery_date') THEN
    ALTER TABLE delivery_logs ADD COLUMN delivery_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Copy data from received_by to receiver_name if received_by exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_logs' AND column_name='received_by') THEN
    UPDATE delivery_logs SET receiver_name = received_by WHERE receiver_name IS NULL AND received_by IS NOT NULL;
  END IF;
END $$;

-- Make sure RLS policy allows anon access
DROP POLICY IF EXISTS "Allow all select for delivery_logs" ON delivery_logs;
DROP POLICY IF EXISTS "Allow all insert for delivery_logs" ON delivery_logs;
DROP POLICY IF EXISTS "Allow all update for delivery_logs" ON delivery_logs;
DROP POLICY IF EXISTS "Allow all delete for delivery_logs" ON delivery_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users on delivery_logs" ON delivery_logs;

CREATE POLICY "Allow all select for delivery_logs" ON delivery_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert for delivery_logs" ON delivery_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update for delivery_logs" ON delivery_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete for delivery_logs" ON delivery_logs FOR DELETE USING (true);

SELECT 'delivery_logs table fixed successfully!' AS result;
