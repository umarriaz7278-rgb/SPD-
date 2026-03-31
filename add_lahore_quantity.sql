-- ===================================================
-- LAHORE INVENTORY & VERIFICATION FIX
-- Copy and Paste this ENTIRE block into Supabase SQL Editor
-- ===================================================

-- 1. Add lahore_quantity to bilties table
ALTER TABLE bilties ADD COLUMN IF NOT EXISTS lahore_quantity NUMERIC DEFAULT 0;

-- 2. Add status and received_quantity to chalan_bilties table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chalan_bilties' AND column_name='status') THEN
    ALTER TABLE chalan_bilties ADD COLUMN status TEXT DEFAULT 'Transit';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chalan_bilties' AND column_name='received_quantity') THEN
    ALTER TABLE chalan_bilties ADD COLUMN received_quantity NUMERIC DEFAULT 0;
  END IF;
END $$;

-- 3. Initial Data Migration (Fix existing Lahore Warehouse items)
UPDATE bilties 
SET lahore_quantity = remaining_quantity,
    remaining_quantity = 0
WHERE status = 'Lahore Warehouse' AND lahore_quantity = 0;

-- Verification:
SELECT 'Migration Successful!' as status;
