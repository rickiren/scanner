/*
  # Insert Test High of Day Alerts

  1. Changes
    - Add sample test alerts for the High of Day Scanner
    - Include a mix of strong and moderate momentum signals
    - Use realistic market data and timestamps

  2. Test Data
    - SOL: Strong momentum breakout with high volume
    - MATIC: Moderate strength breakout
    - ATOM: Fresh breakout signal
*/

INSERT INTO high_of_day_alerts 
  (coin_id, symbol, name, current_price, previous_high, percentage_above_high, 
   volume_24h, market_cap, alert_time, is_confirmed)
VALUES
  -- Strong momentum signal: SOL with significant volume and price increase
  ('sol', 'sol', 'Solana', 
   189.45, 182.30, 3.92,
   1245000000, 82450000000,
   NOW() - INTERVAL '15 minutes',
   true),

  -- Moderate momentum: MATIC breaking out with decent volume
  ('matic', 'matic', 'Polygon',
   1.85, 1.78, 3.93,
   458000000, 18900000000,
   NOW() - INTERVAL '45 minutes',
   true),

  -- Recent breakout: ATOM with fresh momentum
  ('atom', 'atom', 'Cosmos',
   11.45, 11.15, 2.69,
   325000000, 4250000000,
   NOW() - INTERVAL '5 minutes',
   false);