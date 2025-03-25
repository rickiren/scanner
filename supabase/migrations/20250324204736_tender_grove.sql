/*
  # Clean Test Data

  1. Changes
    - Remove all test data from alert tables
    - Keep table structures intact
    - Prepare for fresh data collection

  2. Tables Affected
    - high_of_day_alerts
    - price_alerts
    - running_up_coins
    - top_gainer_coins
*/

-- Clean high of day alerts
TRUNCATE TABLE high_of_day_alerts;

-- Clean price alerts
TRUNCATE TABLE price_alerts;

-- Clean running up coins
TRUNCATE TABLE running_up_coins;

-- Clean top gainer coins
TRUNCATE TABLE top_gainer_coins;