/*
  # Add Price History Table with Safe Creation

  1. Changes
    - Add safe creation of table and indexes
    - Handle existing objects gracefully
    - Update cleaning trigger
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  price numeric NOT NULL,
  volume_24h numeric NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Safely create indexes
DO $$ 
BEGIN
  -- Create coin_id and timestamp composite index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_price_history_coin_id_timestamp'
  ) THEN
    CREATE INDEX idx_price_history_coin_id_timestamp 
    ON price_history (coin_id, timestamp);
  END IF;

  -- Create timestamp index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_price_history_timestamp'
  ) THEN
    CREATE INDEX idx_price_history_timestamp 
    ON price_history (timestamp);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to price history" ON price_history;

-- Create read policy
CREATE POLICY "Allow public read access to price history"
ON price_history
FOR SELECT
TO public
USING (true);

-- Update function to clean old price history
CREATE OR REPLACE FUNCTION clean_old_price_history()
RETURNS trigger AS $$
BEGIN
  DELETE FROM price_history
  WHERE timestamp < NOW() - INTERVAL '15 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely recreate trigger
DROP TRIGGER IF EXISTS clean_price_history_trigger ON price_history;

CREATE TRIGGER clean_price_history_trigger
AFTER INSERT ON price_history
FOR EACH STATEMENT
EXECUTE FUNCTION clean_old_price_history();