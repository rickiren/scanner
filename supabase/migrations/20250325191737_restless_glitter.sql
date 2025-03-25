/*
  # Add Test Data for Running Up Scanner

  1. Changes
    - Add sample data for running up scanner
    - Include realistic price and volume data
    - Add variety of market caps and volume ratios
*/

-- Clean existing test data
TRUNCATE TABLE price_alerts;

-- Insert test data with realistic market metrics
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
) VALUES
  -- Large cap with strong volume
  (
    'bitcoin',
    'btc',
    'Bitcoin',
    72450.00,
    71500.00,
    1.33,
    42500000000,
    1420000000000,
    '10m',
    NOW() - INTERVAL '2 minutes'
  ),
  -- Mid cap with high relative volume
  (
    'solana',
    'sol',
    'Solana',
    145.75,
    142.80,
    2.07,
    3850000000,
    65000000000,
    '10m',
    NOW() - INTERVAL '4 minutes'
  ),
  -- Small cap with explosive volume
  (
    'injective',
    'inj',
    'Injective',
    42.80,
    41.25,
    3.76,
    850000000,
    4200000000,
    '10m',
    NOW() - INTERVAL '6 minutes'
  ),
  -- Micro cap with massive relative volume
  (
    'render',
    'rndr',
    'Render',
    8.45,
    8.15,
    3.68,
    425000000,
    950000000,
    '10m',
    NOW() - INTERVAL '8 minutes'
  ),
  -- Large cap momentum
  (
    'ethereum',
    'eth',
    'Ethereum',
    3875.00,
    3825.00,
    1.31,
    18500000000,
    465000000000,
    '10m',
    NOW() - INTERVAL '10 minutes'
  ),
  -- Mid cap breakout
  (
    'avalanche',
    'avax',
    'Avalanche',
    55.80,
    54.25,
    2.86,
    1250000000,
    21000000000,
    '10m',
    NOW() - INTERVAL '12 minutes'
  );