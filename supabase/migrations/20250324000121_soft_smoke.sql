/*
  # Update Top Gainers Schema

  1. Changes
    - Add new columns for tracking price changes and volume metrics
    - Add indexes for performance optimization
    - Enable RLS with public read access

  2. Security
    - Enable RLS on table
    - Add policy for public read access
*/

-- Add new columns and modify existing ones
ALTER TABLE top_gainer_coins 
ADD COLUMN IF NOT EXISTS volume_market_cap_ratio numeric,
ADD COLUMN IF NOT EXISTS is_major_exchange boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS rsi_24h numeric;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_top_gainers_price_change 
ON top_gainer_coins (price_change_24h);

CREATE INDEX IF NOT EXISTS idx_top_gainers_market_cap 
ON top_gainer_coins (market_cap);

CREATE INDEX IF NOT EXISTS idx_top_gainers_volume 
ON top_gainer_coins (total_volume);

-- Update RLS policy
ALTER TABLE top_gainer_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON top_gainer_coins FOR SELECT 
TO public 
USING (true);