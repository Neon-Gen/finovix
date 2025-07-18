/*
  # Create attendance table

  1. New Tables
    - `attendance`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key to employees)
      - `date` (date, attendance date)
      - `check_in` (time, check-in time)
      - `check_out` (time, check-out time)
      - `break_start` (time, break start time)
      - `break_end` (time, break end time)
      - `regular_hours` (numeric, regular working hours)
      - `overtime_hours` (numeric, overtime hours)
      - `break_hours` (numeric, break hours)
      - `total_hours` (numeric, total hours worked)
      - `regular_pay` (numeric, regular pay amount)
      - `overtime_pay` (numeric, overtime pay amount)
      - `total_pay` (numeric, total pay amount)
      - `status` (text, attendance status)
      - `location` (text, work location)
      - `notes` (text, additional notes)
      - `approved_by` (uuid, approved by user)
      - `approved_at` (timestamp, approval timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `attendance` table
    - Add policies for authenticated users to manage their own attendance records

  3. Indexes
    - Add indexes for user_id, employee_id, date, and status for better query performance
*/

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in time,
  check_out time,
  break_start time,
  break_end time,
  regular_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  break_hours numeric DEFAULT 0,
  total_hours numeric DEFAULT 0,
  regular_pay numeric DEFAULT 0,
  overtime_pay numeric DEFAULT 0,
  total_pay numeric DEFAULT 0,
  status text DEFAULT 'present',
  location text DEFAULT '',
  notes text DEFAULT '',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own attendance records"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records"
  ON attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records"
  ON attendance
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance records"
  ON attendance
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON attendance(user_id);
CREATE INDEX IF NOT EXISTS attendance_employee_id_idx ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance(date);
CREATE INDEX IF NOT EXISTS attendance_status_idx ON attendance(status);
CREATE INDEX IF NOT EXISTS attendance_user_date_idx ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS attendance_employee_date_idx ON attendance(employee_id, date);

-- Create unique constraint for employee attendance per date
CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique 
  ON attendance(employee_id, date);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for status
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
  CHECK (status IN ('present', 'absent', 'late', 'half_day', 'sick_leave', 'casual_leave', 'holiday', 'work_from_home'));

-- Function to calculate attendance totals
CREATE OR REPLACE FUNCTION calculate_attendance_totals()
RETURNS TRIGGER AS $$
DECLARE
  emp_record RECORD;
  regular_rate numeric;
  overtime_rate numeric;
  total_minutes numeric;
  break_minutes numeric;
  work_minutes numeric;
BEGIN
  -- Get employee rates
  SELECT hourly_rate, overtime_rate INTO regular_rate, overtime_rate
  FROM employees 
  WHERE id = NEW.employee_id;
  
  -- Calculate hours if check_in and check_out are provided
  IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
    -- Calculate total minutes worked
    total_minutes := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 60;
    
    -- Calculate break minutes
    break_minutes := 0;
    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
      break_minutes := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 60;
    END IF;
    
    -- Calculate actual work minutes
    work_minutes := total_minutes - break_minutes;
    
    -- Convert to hours
    NEW.total_hours := work_minutes / 60.0;
    NEW.break_hours := break_minutes / 60.0;
    
    -- Calculate regular and overtime hours
    IF NEW.total_hours <= 8 THEN
      NEW.regular_hours := NEW.total_hours;
      NEW.overtime_hours := 0;
    ELSE
      NEW.regular_hours := 8;
      NEW.overtime_hours := NEW.total_hours - 8;
    END IF;
    
    -- Calculate pay
    NEW.regular_pay := NEW.regular_hours * regular_rate;
    NEW.overtime_pay := NEW.overtime_hours * overtime_rate;
    NEW.total_pay := NEW.regular_pay + NEW.overtime_pay;
  ELSE
    -- If absent or no times provided, set everything to 0
    NEW.regular_hours := 0;
    NEW.overtime_hours := 0;
    NEW.break_hours := 0;
    NEW.total_hours := 0;
    NEW.regular_pay := 0;
    NEW.overtime_pay := 0;
    NEW.total_pay := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculation
CREATE TRIGGER calculate_attendance_totals_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_totals();