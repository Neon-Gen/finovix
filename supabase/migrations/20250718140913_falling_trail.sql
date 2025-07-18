/*
  # Create audit log table for tracking changes

  1. New Tables
    - `audit_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `table_name` (text, affected table)
      - `record_id` (uuid, affected record id)
      - `action` (text, action performed)
      - `old_values` (jsonb, old values)
      - `new_values` (jsonb, new values)
      - `ip_address` (inet, user IP address)
      - `user_agent` (text, user agent)
      - `session_id` (text, session identifier)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `audit_log` table
    - Add policies for authenticated users to view their own audit logs

  3. Indexes
    - Add indexes for user_id, table_name, and created_at for better query performance
*/

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_values jsonb DEFAULT '{}'::jsonb,
  new_values jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_table_name_idx ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS audit_log_record_id_idx ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS audit_log_user_created_idx ON audit_log(user_id, created_at DESC);

-- Add constraint for action types
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check 
  CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'VIEW'));

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_table_name text,
  p_record_id uuid,
  p_action text,
  p_old_values jsonb DEFAULT '{}'::jsonb,
  p_new_values jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    p_user_id,
    p_table_name,
    p_record_id,
    p_action,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_values jsonb := '{}'::jsonb;
  new_values jsonb := '{}'::jsonb;
  user_id uuid;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Handle different operations
  IF TG_OP = 'DELETE' THEN
    old_values := to_jsonb(OLD);
    PERFORM create_audit_log(user_id, TG_TABLE_NAME, OLD.id, 'DELETE', old_values, '{}'::jsonb);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_values := to_jsonb(OLD);
    new_values := to_jsonb(NEW);
    PERFORM create_audit_log(user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', old_values, new_values);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_values := to_jsonb(NEW);
    PERFORM create_audit_log(user_id, TG_TABLE_NAME, NEW.id, 'INSERT', '{}'::jsonb, new_values);
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;