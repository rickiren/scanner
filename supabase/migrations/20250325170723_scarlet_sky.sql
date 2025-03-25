/*
  # Fix Layout Templates Migration

  1. Changes
    - Add safe creation of table and indexes
    - Handle existing policies gracefully
    - Maintain all original functionality
*/

-- Create table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS layout_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    layouts jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Safely create indexes
DO $$ 
BEGIN
  -- Create name index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_layout_templates_name'
  ) THEN
    CREATE INDEX idx_layout_templates_name 
    ON layout_templates (name);
  END IF;

  -- Create created_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_layout_templates_created_at'
  ) THEN
    CREATE INDEX idx_layout_templates_created_at 
    ON layout_templates (created_at);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE layout_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to layout templates" ON layout_templates;
  DROP POLICY IF EXISTS "Allow public to create layout templates" ON layout_templates;
  DROP POLICY IF EXISTS "Allow public to update layout templates" ON layout_templates;
  DROP POLICY IF EXISTS "Allow public to delete layout templates" ON layout_templates;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Allow public read access to layout templates"
ON layout_templates
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public to create layout templates"
ON layout_templates
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public to update layout templates"
ON layout_templates
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public to delete layout templates"
ON layout_templates
FOR DELETE
TO public
USING (true);