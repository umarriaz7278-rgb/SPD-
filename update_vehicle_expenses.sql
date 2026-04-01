-- Run this in Supabase SQL Editor
ALTER TABLE vehicle_expenses ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES vehicle_trips(id) ON DELETE CASCADE;
