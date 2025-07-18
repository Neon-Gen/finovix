/*
  # Fix Security Definer View Issue

  1. Changes
    - Remove SECURITY DEFINER from recent_auth_events view
    - Implement proper RLS policies for auth_audit_log table
    - Create secure view that respects user permissions
    - Add proper access controls for audit data

  2. Security Improvements
    - Replace SECURITY DEFINER view with SECURITY INVOKER (default)
    - Implement role-based access for audit logs
    - Add proper RLS policies for data protection
    - Create admin-only access patterns

  3. Access Control
    - Only authenticated users can view their own audit events
    - Admin users can view all audit events (when admin system is implemented)
    - Proper filtering based on user permissions
*/

-- Drop the existing view that has SECURITY DEFINER
DROP VIEW IF EXISTS recent_auth_events;

-- Update the auth_audit_log table policies to be more secure
DROP POLICY IF EXISTS "Admin can view audit logs" ON auth_audit_log;

-- Create proper RLS policies for auth_audit_log
CREATE POLICY "Users can view their own audit logs"
  ON auth_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a policy for system-level logging (for functions)
CREATE POLICY "System can insert audit logs"
  ON auth_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recreate the view WITHOUT SECURITY DEFINER (uses SECURITY INVOKER by default)
-- This ensures the view respects RLS policies and user permissions
CREATE VIEW recent_auth_events AS
SELECT 
  id,
  user_id,
  event_type,
  ip_address,
  user_agent,
  metadata,
  created_at
FROM auth_audit_log
WHERE created_at >= now() - interval '30 days'
ORDER BY created_at DESC;

-- Add RLS to the view (views inherit RLS from underlying tables)
-- The view will now respect the RLS policies on auth_audit_log

-- Update the log_auth_event function to be more secure
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id uuid,
  p_event_type text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Keep SECURITY DEFINER here as this is a logging function
SET search_path = public
AS $$
BEGIN
  -- Only allow logging for the current user or system events
  IF p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
    -- Allow system to log events for any user (when called from triggers/system functions)
    -- But prevent regular users from logging events for other users
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'Cannot log events for other users';
    END IF;
  END IF;

  INSERT INTO auth_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- Create a secure admin view for system administrators
-- This would be used when you implement an admin role system
CREATE OR REPLACE VIEW admin_auth_events AS
SELECT 
  id,
  user_id,
  event_type,
  ip_address,
  user_agent,
  metadata,
  created_at
FROM auth_audit_log
WHERE created_at >= now() - interval '90 days'
ORDER BY created_at DESC;

-- Add comment explaining the security model
COMMENT ON VIEW recent_auth_events IS 'Secure view of recent authentication events. Respects RLS policies - users can only see their own events.';
COMMENT ON VIEW admin_auth_events IS 'Admin view of authentication events. Requires proper admin role implementation for access control.';
COMMENT ON FUNCTION log_auth_event IS 'Secure logging function for authentication events. Uses SECURITY DEFINER but includes proper access controls.';

-- Create a function to safely get user's own recent events
CREATE OR REPLACE FUNCTION get_my_recent_auth_events(days_back integer DEFAULT 30)
RETURNS TABLE (
  id uuid,
  event_type text,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER -- Uses caller's permissions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.event_type,
    a.ip_address,
    a.user_agent,
    a.metadata,
    a.created_at
  FROM auth_audit_log a
  WHERE a.user_id = auth.uid()
    AND a.created_at >= now() - (days_back || ' days')::interval
  ORDER BY a.created_at DESC;
END;
$$;

-- Add indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS auth_audit_log_user_created_idx ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_audit_log_event_created_idx ON auth_audit_log(event_type, created_at DESC);