-- Run this in Supabase SQL Editor to add Order/LCL/Container columns to bilties table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='order_number') THEN
    ALTER TABLE bilties ADD COLUMN order_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='lcl_number') THEN
    ALTER TABLE bilties ADD COLUMN lcl_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='container_number') THEN
    ALTER TABLE bilties ADD COLUMN container_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='other_expense_name') THEN
    ALTER TABLE bilties ADD COLUMN other_expense_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bilties' AND column_name='other_expense_amount') THEN
    ALTER TABLE bilties ADD COLUMN other_expense_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

SELECT 'Order, LCL, Container, Other Expense columns added successfully!' AS result;
