/*
  # Create reports table for saved reports

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text, report name)
      - `description` (text, report description)
      - `type` (text, report type)
      - `parameters` (jsonb, report parameters)
      - `data` (jsonb, report data)
      - `format` (text, report format)
      - `schedule` (text, report schedule)
      - `recipients` (jsonb, email recipients)
      - `last_generated` (timestamp, last generation time)
      - `next_generation` (timestamp, next scheduled generation)
      - `is_active` (boolean, whether report is active)
      - `is_public` (boolean, whether report is public)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reports` table
    - Add policies for authenticated users to manage their own reports

  3. Indexes
    - Add indexes for user_id, type, and schedule for better query performance
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  format text DEFAULT 'pdf',
  schedule text DEFAULT 'manual',
  recipients jsonb DEFAULT '[]'::jsonb,
  last_generated timestamptz,
  next_generation timestamptz,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_type_idx ON reports(type);
CREATE INDEX IF NOT EXISTS reports_schedule_idx ON reports(schedule);
CREATE INDEX IF NOT EXISTS reports_next_generation_idx ON reports(next_generation);
CREATE INDEX IF NOT EXISTS reports_is_active_idx ON reports(is_active);
CREATE INDEX IF NOT EXISTS reports_is_public_idx ON reports(is_public);

-- Create trigger for updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for report types
ALTER TABLE reports ADD CONSTRAINT reports_type_check 
  CHECK (type IN ('financial', 'tax', 'payroll', 'inventory', 'sales', 'expenses', 'assets', 'liabilities', 'attendance', 'custom'));

-- Add constraint for format
ALTER TABLE reports ADD CONSTRAINT reports_format_check 
  CHECK (format IN ('pdf', 'excel', 'csv', 'json', 'html'));

-- Add constraint for schedule
ALTER TABLE reports ADD CONSTRAINT reports_schedule_check 
  CHECK (schedule IN ('manual', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'));