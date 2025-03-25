/*
  # Add Price History Table

  1. New Tables
    - `price_history`
      - Stores historical price data for each coin
      - Keeps rolling 10-minute window of prices
      - Used for calculating price changes

  2. Security
    - Enable RLS on table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  price numeric NOT NULL,
  volume_24h numeric NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_price_history_coin_id_timestamp 
ON price_history (coin_id, timestamp);

CREATE INDEX idx_price_history_timestamp 
ON price_history (timestamp);

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to price history"
ON price_history
FOR SELECT
TO public
USING (true);

-- Add function to clean old price history
CREATE OR REPLACE FUNCTION clean_old_price_history()
RETURNS trigger AS $$
BEGIN
  DELETE FROM price_history
  WHERE timestamp < NOW() - INTERVAL '15 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean old data
CREATE TRIGGER clean_price_history_trigger
AFTER INSERT ON price_history
EXECUTE FUNCTION clean_old_price_history();