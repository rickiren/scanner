/*
  # Fix High of Day Alerts Migration

  1. Changes
    - Add safety checks for existing objects
    - Handle existing policy gracefully
    - Maintain all original functionality
*/

-- Create table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS high_of_day_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coin_id text NOT NULL,
    symbol text NOT NULL,
    name text NOT NULL,
    current_price numeric NOT NULL,
    previous_high numeric NOT NULL,
    percentage_above_high numeric NOT NULL,
    volume_24h numeric NOT NULL,
    market_cap numeric NOT NULL,
    alert_time timestamptz DEFAULT now(),
    is_confirmed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Add indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_high_of_day_coin_id 
  ON high_of_day_alerts (coin_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_high_of_day_alert_time 
  ON high_of_day_alerts (alert_time);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_high_of_day_price 
  ON high_of_day_alerts (current_price);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE high_of_day_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate it
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public read access to high of day alerts" ON high_of_day_alerts;
  
  CREATE POLICY "Allow public read access to high of day alerts"
    ON high_of_day_alerts
    FOR SELECT
    TO public
    USING (true);
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;