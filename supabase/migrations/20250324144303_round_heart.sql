/*
  # Add Running Up Scanner Tables and Triggers

  1. New Tables
    - `price_alerts`
      - `id` (uuid, primary key)
      - `coin_id` (text)
      - `symbol` (text)
      - `name` (text)
      - `current_price` (numeric)
      - `initial_price` (numeric)
      - `price_change_percent` (numeric)
      - `volume_24h` (numeric)
      - `market_cap` (numeric)
      - `time_frame` (text) - '5m', '10m', or '1h'
      - `alert_time` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `price_alerts` table
    - Add policy for public read access
*/

-- Create price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  current_price numeric NOT NULL,
  initial_price numeric NOT NULL,
  price_change_percent numeric NOT NULL,
  volume_24h numeric NOT NULL,
  market_cap numeric NOT NULL,
  time_frame text NOT NULL CHECK (time_frame IN ('5m', '10m', '1h')),
  alert_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_coin_id ON price_alerts(coin_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_time_frame ON price_alerts(time_frame);
CREATE INDEX IF NOT EXISTS idx_price_alerts_alert_time ON price_alerts(alert_time);

-- Enable RLS
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to price alerts"
ON price_alerts
FOR SELECT
TO public
USING (true);