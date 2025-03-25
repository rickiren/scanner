/*
  # Add test data for price alerts

  1. Test Data
    - Adds sample price alerts for different time frames (5m, 10m, 1h)
    - Includes a variety of coins with different price changes and volumes
    - Uses realistic timestamps within the last hour
*/

-- Insert test data for price alerts
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
  -- 5m alerts
  (
    'bitcoin',
    'btc',
    'Bitcoin',
    65000.00,
    61750.00,
    5.26,
    28500000000,
    1250000000000,
    '5m',
    NOW() - INTERVAL '2 minutes'
  ),
  (
    'ethereum',
    'eth',
    'Ethereum',
    3850.00,
    3657.50,
    5.26,
    12500000000,
    450000000000,
    '5m',
    NOW() - INTERVAL '4 minutes'
  ),
  -- 10m alerts
  (
    'solana',
    'sol',
    'Solana',
    125.00,
    112.50,
    11.11,
    2500000000,
    45000000000,
    '10m',
    NOW() - INTERVAL '6 minutes'
  ),
  (
    'cardano',
    'ada',
    'Cardano',
    0.65,
    0.58,
    12.07,
    850000000,
    22000000000,
    '10m',
    NOW() - INTERVAL '8 minutes'
  ),
  -- 1h alerts
  (
    'polkadot',
    'dot',
    'Polkadot',
    22.50,
    19.57,
    15.00,
    750000000,
    25000000000,
    '1h',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    'avalanche',
    'avax',
    'Avalanche',
    42.00,
    35.00,
    20.00,
    950000000,
    15000000000,
    '1h',
    NOW() - INTERVAL '20 minutes'
  );

-- Insert test data for high of day alerts
INSERT INTO high_of_day_alerts (
  coin_id,
  symbol,
  name,
  current_price,
  previous_high,
  percentage_above_high,
  volume_24h,
  market_cap,
  alert_time,
  is_confirmed
) VALUES
  (
    'bitcoin',
    'btc',
    'Bitcoin',
    66500.00,
    65000.00,
    2.31,
    28500000000,
    1250000000000,
    NOW() - INTERVAL '5 minutes',
    true
  ),
  (
    'ethereum',
    'eth',
    'Ethereum',
    3900.00,
    3850.00,
    1.30,
    12500000000,
    450000000000,
    NOW() - INTERVAL '10 minutes',
    true
  ),
  (
    'solana',
    'sol',
    'Solana',
    128.00,
    125.00,
    2.40,
    2500000000,
    45000000000,
    NOW() - INTERVAL '15 minutes',
    true
  );

-- Insert test data for running up coins
INSERT INTO running_up_coins (
  coin_id,
  symbol,
  name,
  current_price,
  market_cap,
  total_volume,
  price_change_5m,
  volume_change_5m,
  volume_60m_avg,
  volume_supply_ratio,
  volume_market_cap_ratio,
  transaction_count_24h,
  active_addresses_24h,
  rsi_5m,
  is_major_exchange
) VALUES
  (
    'bitcoin',
    'btc',
    'Bitcoin',
    66500.00,
    1250000000000,
    28500000000,
    5.26,
    15.50,
    27500000000,
    0.0228,
    0.0228,
    450000,
    950000,
    75.5,
    true
  ),
  (
    'ethereum',
    'eth',
    'Ethereum',
    3900.00,
    450000000000,
    12500000000,
    5.26,
    12.30,
    11800000000,
    0.0278,
    0.0278,
    380000,
    850000,
    72.8,
    true
  ),
  (
    'solana',
    'sol',
    'Solana',
    128.00,
    45000000000,
    2500000000,
    11.11,
    25.40,
    2250000000,
    0.0556,
    0.0556,
    220000,
    450000,
    82.3,
    true
  );