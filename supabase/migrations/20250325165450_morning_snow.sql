/*
  # Add Layout Templates Table

  1. New Tables
    - `layout_templates`
      - Stores user-created layout configurations
      - Includes template name, description, and layout settings
      - Tracks creation and update timestamps

  2. Security
    - Enable RLS on table
    - Add policies for public read/write access
*/

CREATE TABLE IF NOT EXISTS layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  layouts jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_layout_templates_name 
ON layout_templates (name);

CREATE INDEX IF NOT EXISTS idx_layout_templates_created_at 
ON layout_templates (created_at);

-- Enable RLS
ALTER TABLE layout_templates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
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