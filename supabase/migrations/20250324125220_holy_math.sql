/*
  # Add High of Day Scanner

  1. Changes
    - Add new table for tracking high of day alerts
    - Add indexes for performance optimization
    - Enable RLS with public read access

  2. New Table
    - `high_of_day_alerts`
      - Tracks when coins reach new daily highs
      - Stores price, volume, and time data
      - Includes alert status and verification
*/

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_high_of_day_coin_id 
ON high_of_day_alerts (coin_id);

CREATE INDEX IF NOT EXISTS idx_high_of_day_alert_time 
ON high_of_day_alerts (alert_time);

CREATE INDEX IF NOT EXISTS idx_high_of_day_price 
ON high_of_day_alerts (current_price);

-- Enable RLS
ALTER TABLE high_of_day_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to high of day alerts"
  ON high_of_day_alerts
  FOR SELECT
  TO public
  USING (true);