/*
  # Clean existing data and update high of day alerts table

  1. Changes
    - Clean existing test data
    - Add timestamp column for high tracking
    - Add volume tracking columns
*/

-- Clean existing data
TRUNCATE TABLE high_of_day_alerts;
TRUNCATE TABLE price_alerts;
TRUNCATE TABLE running_up_coins;
TRUNCATE TABLE top_gainer_coins;

-- Add high tracking timestamp if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'high_of_day_alerts' 
    AND column_name = 'high_timestamp'
  ) THEN
    ALTER TABLE high_of_day_alerts 
    ADD COLUMN high_timestamp timestamptz DEFAULT now();
  END IF;
END $$;

-- Add volume tracking columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'high_of_day_alerts' 
    AND column_name = 'volume_at_high'
  ) THEN
    ALTER TABLE high_of_day_alerts 
    ADD COLUMN volume_at_high numeric DEFAULT 0;
  END IF;
END $$;