/*
  # Add Filter Templates Table

  1. New Tables
    - `filter_templates`
      - Stores user-created filter templates
      - Includes template name, description, and filter settings
      - Tracks creation and update timestamps

  2. Security
    - Enable RLS on table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS filter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_filter_templates_name 
ON filter_templates (name);

CREATE INDEX IF NOT EXISTS idx_filter_templates_created_at 
ON filter_templates (created_at);

-- Enable RLS
ALTER TABLE filter_templates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access to filter templates"
  ON filter_templates
  FOR SELECT
  TO public
  USING (true);

-- Insert some example templates
INSERT INTO filter_templates (name, description, filters) VALUES
(
  'High Volume Momentum',
  'Tracks coins with significant volume and positive price movement in the last hour',
  '{
    "minPrice": 0.1,
    "maxPrice": 1000,
    "minVolume24h": 1000000,
    "maxVolume24h": 1000000000000,
    "minPercentageChange1h": 2,
    "maxPercentageChange1h": 100,
    "minRelativeVolume": 2,
    "resultsLimit": 50,
    "sortBy": "percentageChange1h",
    "sortDirection": "desc"
  }'::jsonb
),
(
  'Breakout Scanner',
  'Identifies coins breaking out with increased transaction activity',
  '{
    "minPrice": 0.01,
    "maxPrice": 100,
    "minPercentageChange24h": 5,
    "maxPercentageChange24h": 200,
    "minTransactionCount": 1000,
    "minActiveAddresses": 500,
    "minRelativeVolume": 3,
    "resultsLimit": 30,
    "sortBy": "volume24h",
    "sortDirection": "desc"
  }'::jsonb
),
(
  'Large Cap Movers',
  'Tracks significant movements in high market cap coins',
  '{
    "minMarketCap": 1000000000,
    "maxMarketCap": 1000000000000,
    "minVolume24h": 10000000,
    "minPercentageChange1h": 1,
    "minRelativeVolume": 1.5,
    "resultsLimit": 20,
    "sortBy": "marketCap",
    "sortDirection": "desc"
  }'::jsonb
);