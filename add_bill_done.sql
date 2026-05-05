-- Run this in Supabase SQL Editor to add bill_done column to bilties table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='bill_done') THEN
    ALTER TABLE bilties ADD COLUMN bill_done BOOLEAN DEFAULT false;
  END IF;
END $$;

SELECT 'bill_done column added successfully!' AS result;
