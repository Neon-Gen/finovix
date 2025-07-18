/*
  # Add missing user settings columns

  1. New Columns
    - `bill_reminders` (boolean, default true) - Enable/disable bill reminder notifications
    - `payment_alerts` (boolean, default true) - Enable/disable payment alert notifications  
    - `expense_alerts` (boolean, default true) - Enable/disable expense alert notifications
    - `weekly_reports` (boolean, default true) - Enable/disable weekly report emails
    - `monthly_reports` (boolean, default true) - Enable/disable monthly report emails
    - `analytics_tracking` (boolean, default false) - Enable/disable analytics tracking
    - `two_factor_auth` (boolean, default false) - Enable/disable two-factor authentication

  2. Changes
    - Add missing notification and security preference columns to user_settings table
    - All new columns have appropriate default values to maintain data consistency
*/

-- Add missing columns to user_settings table
DO $$
BEGIN
  -- Add bill_reminders column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'bill_reminders'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN bill_reminders boolean DEFAULT true;
  END IF;

  -- Add payment_alerts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'payment_alerts'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN payment_alerts boolean DEFAULT true;
  END IF;

  -- Add expense_alerts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'expense_alerts'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN expense_alerts boolean DEFAULT true;
  END IF;

  -- Add weekly_reports column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'weekly_reports'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN weekly_reports boolean DEFAULT true;
  END IF;

  -- Add monthly_reports column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'monthly_reports'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN monthly_reports boolean DEFAULT true;
  END IF;

  -- Add analytics_tracking column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'analytics_tracking'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN analytics_tracking boolean DEFAULT false;
  END IF;

  -- Add two_factor_auth column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'two_factor_auth'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN two_factor_auth boolean DEFAULT false;
  END IF;
END $$;