/*
  # Create liabilities table

  1. New Tables
    - `liabilities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text, liability name)
      - `description` (text, liability description)
      - `type` (text, liability type - loan, credit, mortgage, etc.)
      - `creditor_name` (text, name of creditor)
      - `creditor_contact` (text, creditor contact info)
      - `principal_amount` (numeric, original amount)
      - `current_balance` (numeric, remaining balance)
      - `interest_rate` (numeric, annual interest rate)
      - `payment_frequency` (text, payment frequency)
      - `payment_amount` (numeric, regular payment amount)
      - `start_date` (date, when liability started)
      - `due_date` (date, when fully due)
      - `next_payment_date` (date, next payment due)
      - `collateral` (text, collateral description)
      - `status` (text, current status)
      - `priority` (text, payment priority)
      - `notes` (text, additional notes)
      - `is_active` (boolean, whether liability is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `liabilities` table
    - Add policies for authenticated users to manage their own liabilities

  3. Indexes
    - Add indexes for user_id, type, and due dates for better query performance
*/

CREATE TABLE IF NOT EXISTS liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL,
  creditor_name text NOT NULL,
  creditor_contact text DEFAULT '',
  principal_amount numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  interest_rate numeric DEFAULT 0,
  payment_frequency text DEFAULT 'monthly',
  payment_amount numeric DEFAULT 0,
  start_date date NOT NULL,
  due_date date,
  next_payment_date date,
  collateral text DEFAULT '',
  status text DEFAULT 'active',
  priority text DEFAULT 'medium',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own liabilities"
  ON liabilities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liabilities"
  ON liabilities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own liabilities"
  ON liabilities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liabilities"
  ON liabilities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS liabilities_user_id_idx ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS liabilities_type_idx ON liabilities(type);
CREATE INDEX IF NOT EXISTS liabilities_due_date_idx ON liabilities(due_date);
CREATE INDEX IF NOT EXISTS liabilities_next_payment_date_idx ON liabilities(next_payment_date);
CREATE INDEX IF NOT EXISTS liabilities_status_idx ON liabilities(status);
CREATE INDEX IF NOT EXISTS liabilities_is_active_idx ON liabilities(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON liabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for liability types
ALTER TABLE liabilities ADD CONSTRAINT liabilities_type_check 
  CHECK (type IN ('loan', 'credit_card', 'mortgage', 'line_of_credit', 'accounts_payable', 'accrued_expenses', 'other'));

-- Add constraint for payment frequency
ALTER TABLE liabilities ADD CONSTRAINT liabilities_payment_frequency_check 
  CHECK (payment_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'one_time'));

-- Add constraint for status
ALTER TABLE liabilities ADD CONSTRAINT liabilities_status_check 
  CHECK (status IN ('active', 'paid_off', 'defaulted', 'restructured', 'suspended'));

-- Add constraint for priority
ALTER TABLE liabilities ADD CONSTRAINT liabilities_priority_check 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));