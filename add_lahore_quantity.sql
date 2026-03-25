-- Migration: Add lahore_quantity to track Lahore Warehouse stock separately
ALTER TABLE bilties ADD COLUMN IF NOT EXISTS lahore_quantity NUMERIC DEFAULT 0;

-- Update existing records: if status is 'Lahore Warehouse', move remaining_quantity to lahore_quantity
-- This is a one-time fix for existing data.
UPDATE bilties 
SET lahore_quantity = remaining_quantity,
    remaining_quantity = 0
WHERE status = 'Lahore Warehouse';

-- Update records where status is 'Delivered' but might have partial lahore stock
UPDATE bilties 
SET lahore_quantity = 0
WHERE status = 'Delivered';
