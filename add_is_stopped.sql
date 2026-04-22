-- Run this in Supabase SQL Editor to add is_stopped column to bilties table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='is_stopped') THEN
    ALTER TABLE bilties ADD COLUMN is_stopped BOOLEAN DEFAULT false;
  END IF;
END $$;

SELECT 'is_stopped column added successfully!' AS result;
