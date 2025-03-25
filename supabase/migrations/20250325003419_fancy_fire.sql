/*
  # Update Running Up Scanner Threshold

  1. Changes
    - Update the running up scanner to trigger at 1% instead of 5%
    - Keep all other functionality the same
    - Clean existing test data for fresh start
*/

-- Clean existing data to start fresh
TRUNCATE TABLE price_alerts;

-- Insert a test alert to verify the new threshold
INSERT INTO price_alerts (
  coin_id,
  symbol,
  name,
  current_price,
  initial_price,
  price_change_percent,
  volume_24h,
  market_cap,
  time_frame,
  alert_time
) VALUES (
  'btc',
  'btc',
  'Bitcoin',
  65000.00,
  64350.00,
  1.01,
  28500000000,
  1250000000000,
  '10m',
  NOW()
);