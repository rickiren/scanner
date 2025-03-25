/*
  # Create Scanner Tables

  1. New Tables
    - `high_momentum_coins`
      - Stores coins hitting new highs with strong momentum
      - Includes price, volume, and momentum metrics
    
    - `top_gainer_coins`
      - Tracks biggest gainers over 24h periods
      - Stores gain percentages and volume data
    
    - `running_up_coins`
      - Captures rapid price surges
      - Includes short-term price and volume metrics

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
*/

-- High Momentum Coins Table
CREATE TABLE IF NOT EXISTS high_momentum_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  current_price numeric NOT NULL,
  market_cap numeric NOT NULL,
  total_volume numeric NOT NULL,
  price_change_1h numeric NOT NULL,
  high_24h numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE high_momentum_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to high momentum coins"
  ON high_momentum_coins
  FOR SELECT
  TO public
  USING (true);

-- Top Gainer Coins Table
CREATE TABLE IF NOT EXISTS top_gainer_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  current_price numeric NOT NULL,
  market_cap numeric NOT NULL,
  total_volume numeric NOT NULL,
  price_change_24h numeric NOT NULL,
  volume_market_cap_ratio numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE top_gainer_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to top gainer coins"
  ON top_gainer_coins
  FOR SELECT
  TO public
  USING (true);

-- Running Up Coins Table
CREATE TABLE IF NOT EXISTS running_up_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  current_price numeric NOT NULL,
  market_cap numeric NOT NULL,
  total_volume numeric NOT NULL,
  price_change_5m numeric NOT NULL,
  volume_change_5m numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE running_up_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to running up coins"
  ON running_up_coins
  FOR SELECT
  TO public
  USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_high_momentum_coins_coin_id ON high_momentum_coins(coin_id);
CREATE INDEX IF NOT EXISTS idx_top_gainer_coins_coin_id ON top_gainer_coins(coin_id);
CREATE INDEX IF NOT EXISTS idx_running_up_coins_coin_id ON running_up_coins(coin_id);