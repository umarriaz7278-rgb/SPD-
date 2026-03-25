-- SQL Script for Delivery Logs
-- Instructions: Run this script in the Supabase SQL Editor if you want to keep a permanent history of who received what.

CREATE TABLE IF NOT EXISTS delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bilty_id UUID REFERENCES bilties(id) ON DELETE CASCADE,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT,
    receiver_cnic TEXT,
    delivered_quantity NUMERIC NOT NULL,
    delivery_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS (Row Level Security) if you have it enforced
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users (assuming basic setup)
CREATE POLICY "Enable all for authenticated users on delivery_logs" ON delivery_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
