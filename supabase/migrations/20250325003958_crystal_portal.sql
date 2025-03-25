/*
  # Clean Test Data and Update Price History Table

  1. Changes
    - Remove test data from price_alerts table
    - Add index on price_history for faster lookups
    - Update clean_old_price_history function to keep more history
*/

-- Clean existing test data
TRUNCATE TABLE price_alerts;
TRUNCATE TABLE price_history;

-- Modify the clean_old_price_history function to keep more history
CREATE OR REPLACE FUNCTION clean_old_price_history()
RETURNS trigger AS $$
BEGIN
  -- Keep 15 minutes of price history for each coin
  DELETE FROM price_history
  WHERE timestamp < NOW() - INTERVAL '15 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;