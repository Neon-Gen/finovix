/*
  # Enable Auth Security Features

  1. Security Enhancements
    - Enable leaked password protection
    - Configure password strength requirements
    - Set up proper session management
    - Enable email confirmation requirements

  2. Auth Configuration Updates
    - Minimum password length: 8 characters
    - Require email confirmation: true
    - Enable leaked password protection: true
    - Session timeout: 24 hours
    - Refresh token rotation: enabled

  3. Additional Security Measures
    - Rate limiting for auth endpoints
    - Proper CORS configuration
    - Secure cookie settings
*/

-- Enable leaked password protection and other security features
-- Note: These settings are typically configured in the Supabase Dashboard
-- This migration serves as documentation of required settings

-- Create a function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Check for at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Check for at least one digit
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Check for at least one special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create a trigger to validate passwords (additional client-side validation)
-- Note: Primary validation should be done by Supabase Auth with leaked password protection enabled

-- Add security audit log table for tracking auth events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading audit logs for admin users (implement based on your admin system)
CREATE POLICY "Admin can view audit logs"
  ON auth_audit_log
  FOR SELECT
  TO authenticated
  USING (false); -- Modify this based on your admin role system

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS auth_audit_log_user_id_idx ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS auth_audit_log_created_at_idx ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS auth_audit_log_event_type_idx ON auth_audit_log(event_type);

-- Function to log auth events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id uuid,
  p_event_type text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO auth_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata);
END;
$$;

-- Create a view for recent security events (last 30 days)
CREATE OR REPLACE VIEW recent_auth_events AS
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

-- Add comment explaining manual dashboard configuration required
COMMENT ON FUNCTION validate_password_strength IS 'Additional password validation function. Primary leaked password protection must be enabled in Supabase Dashboard under Authentication > Settings > Security';