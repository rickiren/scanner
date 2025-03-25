/*
  # Update High Momentum Scanner

  1. Changes
    - Add new columns to track additional metrics for momentum scanning
    - Add indexes for performance optimization
    - Update RLS policies

  2. New Columns
    - `high_24h` (already exists)
    - `volume_supply_ratio` (new)
    - `volume_market_cap_ratio` (new)
    - `transaction_count_24h` (new)
    - `active_addresses_24h` (new)
    - `rsi_1h` (new)
    - `is_major_exchange` (new)
*/

-- Add new columns for momentum tracking
ALTER TABLE high_momentum_coins 
ADD COLUMN IF NOT EXISTS volume_supply_ratio numeric,
ADD COLUMN IF NOT EXISTS volume_market_cap_ratio numeric,
ADD COLUMN IF NOT EXISTS transaction_count_24h integer,
ADD COLUMN IF NOT EXISTS active_addresses_24h integer,
ADD COLUMN IF NOT EXISTS rsi_1h numeric,
ADD COLUMN IF NOT EXISTS is_major_exchange boolean DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_high_momentum_market_cap 
ON high_momentum_coins (market_cap);

CREATE INDEX IF NOT EXISTS idx_high_momentum_price 
ON high_momentum_coins (current_price);

CREATE INDEX IF NOT EXISTS idx_high_momentum_volume 
ON high_momentum_coins (total_volume);

-- Update RLS policy
ALTER TABLE high_momentum_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON high_momentum_coins FOR SELECT 
TO public 
USING (true);