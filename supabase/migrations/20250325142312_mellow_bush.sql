/*
  # Update Price History Policies and Cleaning Function

  1. Changes
    - Fix ORDER BY syntax in cleaning function
    - Maintain RLS and policies
    - Update cleaning strategy
*/

-- Enable RLS if not already enabled
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public to insert price history" ON price_history;

-- Add insert policy
CREATE POLICY "Allow public to insert price history"
ON price_history
FOR INSERT
TO public
WITH CHECK (true);

-- Update the clean_old_price_history function to be less aggressive
CREATE OR REPLACE FUNCTION clean_old_price_history()
RETURNS trigger AS $$
DECLARE
  old_records int;
BEGIN
  -- Count old records
  SELECT COUNT(*) INTO old_records 
  FROM price_history 
  WHERE timestamp < NOW() - INTERVAL '15 minutes';
  
  -- Only clean if there are more than 1000 old records
  IF old_records > 1000 THEN
    -- Delete oldest records first, limited to 500 at a time
    DELETE FROM price_history
    WHERE id IN (
      SELECT id 
      FROM price_history 
      WHERE timestamp < NOW() - INTERVAL '15 minutes'
      ORDER BY timestamp ASC
      LIMIT 500
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;