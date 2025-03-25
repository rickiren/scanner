/*
  # Add update policy for filter templates

  1. Security Changes
    - Add policy to allow public updates of templates
*/

-- Add update policy
CREATE POLICY "Allow public to update templates"
ON filter_templates
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);