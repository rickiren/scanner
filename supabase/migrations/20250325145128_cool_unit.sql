/*
  # Add News Alerts Table

  1. New Tables
    - `news_alerts`
      - Stores real-time news alerts for tracked coins
      - Includes sentiment analysis and relevance scoring
      - Tracks alert timing and metadata

  2. Security
    - Enable RLS on table
    - Add policies for public read/write access
*/

-- Create news alerts table
CREATE TABLE IF NOT EXISTS news_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  news_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  relevance_score numeric NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  alert_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_alerts_coin_id 
ON news_alerts (coin_id);

CREATE INDEX IF NOT EXISTS idx_news_alerts_alert_time 
ON news_alerts (alert_time);

CREATE INDEX IF NOT EXISTS idx_news_alerts_sentiment 
ON news_alerts (sentiment);

-- Enable RLS
ALTER TABLE news_alerts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access to news alerts"
ON news_alerts
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public to insert news alerts"
ON news_alerts
FOR INSERT
TO public
WITH CHECK (true);

-- Create function to clean old news alerts
CREATE OR REPLACE FUNCTION clean_old_news_alerts()
RETURNS trigger AS $$
BEGIN
  DELETE FROM news_alerts
  WHERE alert_time < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean old alerts
CREATE TRIGGER clean_news_alerts_trigger
AFTER INSERT ON news_alerts
FOR EACH STATEMENT
EXECUTE FUNCTION clean_old_news_alerts();