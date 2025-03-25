/*
  # Add delete policy for filter templates

  1. Security Changes
    - Add policy to allow public deletion of templates
*/

-- Add delete policy
CREATE POLICY "Allow public to delete templates"
ON filter_templates
FOR DELETE
TO public
USING (true);