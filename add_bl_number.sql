-- Run this in Supabase SQL Editor to add bl_number column to bilties table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='bl_number') THEN
    ALTER TABLE bilties ADD COLUMN bl_number TEXT;
  END IF;
END $$;

SELECT 'bl_number column added successfully!' AS result;
