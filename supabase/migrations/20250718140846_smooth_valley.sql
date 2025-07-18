/*
  # Create payroll table

  1. New Tables
    - `payroll`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key to employees)
      - `pay_period_start` (date, pay period start)
      - `pay_period_end` (date, pay period end)
      - `pay_date` (date, payment date)
      - `regular_hours` (numeric, regular hours worked)
      - `overtime_hours` (numeric, overtime hours worked)
      - `holiday_hours` (numeric, holiday hours)
      - `sick_hours` (numeric, sick leave hours)
      - `vacation_hours` (numeric, vacation hours)
      - `regular_pay` (numeric, regular pay amount)
      - `overtime_pay` (numeric, overtime pay amount)
      - `holiday_pay` (numeric, holiday pay amount)
      - `bonus` (numeric, bonus amount)
      - `commission` (numeric, commission amount)
      - `gross_pay` (numeric, gross pay amount)
      - `pf_deduction` (numeric, provident fund deduction)
      - `esi_deduction` (numeric, ESI deduction)
      - `tax_deduction` (numeric, tax deduction)
      - `other_deductions` (numeric, other deductions)
      - `total_deductions` (numeric, total deductions)
      - `net_pay` (numeric, net pay amount)
      - `status` (text, payroll status)
      - `payment_method` (text, payment method)
      - `bank_account` (text, bank account details)
      - `notes` (text, additional notes)
      - `processed_by` (uuid, processed by user)
      - `processed_at` (timestamp, processing timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `payroll` table
    - Add policies for authenticated users to manage their own payroll records

  3. Indexes
    - Add indexes for user_id, employee_id, and pay period for better query performance
*/

CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  pay_date date NOT NULL,
  regular_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  holiday_hours numeric DEFAULT 0,
  sick_hours numeric DEFAULT 0,
  vacation_hours numeric DEFAULT 0,
  regular_pay numeric DEFAULT 0,
  overtime_pay numeric DEFAULT 0,
  holiday_pay numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  gross_pay numeric DEFAULT 0,
  pf_deduction numeric DEFAULT 0,
  esi_deduction numeric DEFAULT 0,
  tax_deduction numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,
  total_deductions numeric DEFAULT 0,
  net_pay numeric DEFAULT 0,
  status text DEFAULT 'draft',
  payment_method text DEFAULT 'bank_transfer',
  bank_account text DEFAULT '',
  notes text DEFAULT '',
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payroll records"
  ON payroll
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payroll records"
  ON payroll
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payroll records"
  ON payroll
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payroll records"
  ON payroll
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS payroll_user_id_idx ON payroll(user_id);
CREATE INDEX IF NOT EXISTS payroll_employee_id_idx ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS payroll_pay_period_start_idx ON payroll(pay_period_start);
CREATE INDEX IF NOT EXISTS payroll_pay_period_end_idx ON payroll(pay_period_end);
CREATE INDEX IF NOT EXISTS payroll_pay_date_idx ON payroll(pay_date);
CREATE INDEX IF NOT EXISTS payroll_status_idx ON payroll(status);

-- Create unique constraint for employee payroll per pay period
CREATE UNIQUE INDEX IF NOT EXISTS payroll_employee_period_unique 
  ON payroll(employee_id, pay_period_start, pay_period_end);

-- Create trigger for updated_at
CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for status
ALTER TABLE payroll ADD CONSTRAINT payroll_status_check 
  CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled'));

-- Add constraint for payment method
ALTER TABLE payroll ADD CONSTRAINT payroll_payment_method_check 
  CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'digital_wallet', 'other'));

-- Function to calculate payroll totals
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER AS $$
DECLARE
  emp_record RECORD;
BEGIN
  -- Get employee details
  SELECT hourly_rate, overtime_rate INTO emp_record
  FROM employees 
  WHERE id = NEW.employee_id;
  
  -- Calculate pay amounts
  NEW.regular_pay := NEW.regular_hours * emp_record.hourly_rate;
  NEW.overtime_pay := NEW.overtime_hours * emp_record.overtime_rate;
  NEW.holiday_pay := NEW.holiday_hours * emp_record.hourly_rate * 2; -- Double pay for holidays
  
  -- Calculate gross pay
  NEW.gross_pay := NEW.regular_pay + NEW.overtime_pay + NEW.holiday_pay + NEW.bonus + NEW.commission;
  
  -- Calculate deductions (basic calculations - can be customized)
  NEW.pf_deduction := NEW.gross_pay * 0.12; -- 12% PF
  NEW.esi_deduction := CASE 
    WHEN NEW.gross_pay <= 21000 THEN NEW.gross_pay * 0.0075 -- 0.75% ESI if salary <= 21000
    ELSE 0 
  END;
  
  -- Basic tax calculation (simplified)
  NEW.tax_deduction := CASE 
    WHEN NEW.gross_pay * 12 > 250000 THEN (NEW.gross_pay * 12 - 250000) * 0.05 / 12 -- 5% tax above 2.5L annually
    ELSE 0 
  END;
  
  -- Calculate total deductions
  NEW.total_deductions := NEW.pf_deduction + NEW.esi_deduction + NEW.tax_deduction + NEW.other_deductions;
  
  -- Calculate net pay
  NEW.net_pay := NEW.gross_pay - NEW.total_deductions;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculation
CREATE TRIGGER calculate_payroll_totals_trigger
  BEFORE INSERT OR UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payroll_totals();