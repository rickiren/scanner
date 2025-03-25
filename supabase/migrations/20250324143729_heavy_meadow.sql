/*
  # Fix update policy for filter templates

  1. Security Changes
    - Safely handle update policy creation
    - Drop existing policy if it exists
    - Recreate update policy
*/

-- Drop existing update policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public to update templates" ON filter_templates;
END $$;

-- Create update policy
CREATE POLICY "Allow public to update templates"
ON filter_templates
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);