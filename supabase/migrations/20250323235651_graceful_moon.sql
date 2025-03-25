/*
  # Update Running Up Scanner

  1. Changes
    - Add new columns for enhanced metrics tracking
    - Add indexes for performance optimization
    - Update RLS policies

  2. New Columns
    - `volume_change_5m` (already exists)
    - `volume_60m_avg` (new)
    - `volume_supply_ratio` (new)
    - `volume_market_cap_ratio` (new)
    - `transaction_count_24h` (new)
    - `active_addresses_24h` (new)
    - `rsi_5m` (new)
    - `is_major_exchange` (new)
*/

-- Add new columns for running up scanner
ALTER TABLE running_up_coins 
ADD COLUMN IF NOT EXISTS volume_60m_avg numeric,
ADD COLUMN IF NOT EXISTS volume_supply_ratio numeric,
ADD COLUMN IF NOT EXISTS volume_market_cap_ratio numeric,
ADD COLUMN IF NOT EXISTS transaction_count_24h integer,
ADD COLUMN IF NOT EXISTS active_addresses_24h integer,
ADD COLUMN IF NOT EXISTS rsi_5m numeric,
ADD COLUMN IF NOT EXISTS is_major_exchange boolean DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_running_up_market_cap 
ON running_up_coins (market_cap);

CREATE INDEX IF NOT EXISTS idx_running_up_price 
ON running_up_coins (current_price);

CREATE INDEX IF NOT EXISTS idx_running_up_volume 
ON running_up_coins (total_volume);

CREATE INDEX IF NOT EXISTS idx_running_up_price_change 
ON running_up_coins (price_change_5m);

-- Update RLS policy
ALTER TABLE running_up_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON running_up_coins FOR SELECT 
TO public 
USING (true);