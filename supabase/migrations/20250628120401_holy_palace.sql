/*
  # Create user_settings table

  1. New Tables
    - `user_settings`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text, nullable)
      - `avatar_url` (text, nullable)
      - `company_name` (text, nullable)
      - `company_address` (text, nullable)
      - `company_phone` (text, nullable)
      - `company_email` (text, nullable)
      - `company_website` (text, nullable)
      - `tax_number` (text, nullable)
      - `currency` (text, default 'USD')
      - `date_format` (text, default 'MM/DD/YYYY')
      - `time_format` (text, default '12')
      - `language` (text, default 'en')
      - `timezone` (text, default 'UTC')
      - `default_tax_rate` (numeric, default 0)
      - `email_notifications` (boolean, default true)
      - `push_notifications` (boolean, default true)
      - `marketing_emails` (boolean, default false)
      - `data_sharing` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for authenticated users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_website text,
  tax_number text,
  currency text NOT NULL DEFAULT 'USD',
  date_format text NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format text NOT NULL DEFAULT '12',
  language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  default_tax_rate numeric NOT NULL DEFAULT 0,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  data_sharing boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();