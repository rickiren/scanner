/*
  # Fix RLS policies for filter templates table

  1. Security
    - Enable RLS on filter_templates table if not already enabled
    - Add policies if they don't exist:
      - Public read access to all templates
      - Public write access to allow template creation
*/

-- Enable RLS (if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'filter_templates'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE filter_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to filter templates" ON filter_templates;
  DROP POLICY IF EXISTS "Allow public to create templates" ON filter_templates;
END $$;

-- Create policies
CREATE POLICY "Allow public read access to filter templates"
ON filter_templates
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public to create templates"
ON filter_templates
FOR INSERT
TO public
WITH CHECK (true);