/*
  # Add audit triggers to main tables

  1. Audit Triggers
    - Add audit triggers to all main business tables
    - Track INSERT, UPDATE, DELETE operations
    - Store old and new values for compliance

  2. Tables to Audit
    - bills
    - expenses
    - employees
    - assets
    - liabilities
    - inventory
    - purchase_orders
    - attendance
    - payroll
*/

-- Add audit triggers to bills table
CREATE TRIGGER bills_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to expenses table
CREATE TRIGGER expenses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to employees table
CREATE TRIGGER employees_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to assets table
CREATE TRIGGER assets_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to liabilities table
CREATE TRIGGER liabilities_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON liabilities
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to inventory table
CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to purchase_orders table
CREATE TRIGGER purchase_orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to attendance table
CREATE TRIGGER attendance_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to payroll table
CREATE TRIGGER payroll_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Add audit triggers to user_settings table
CREATE TRIGGER user_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();