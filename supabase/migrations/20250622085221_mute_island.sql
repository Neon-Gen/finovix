/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, employee full name)
      - `email` (text, employee email address)
      - `phone` (text, employee phone number)
      - `hourly_rate` (numeric, regular hourly pay rate)
      - `overtime_rate` (numeric, overtime hourly pay rate)
      - `position` (text, job position/title)
      - `department` (text, department name)
      - `hire_date` (date, date of hire)
      - `is_active` (boolean, employment status)
      - `created_at` (timestamp, record creation time)

  2. Security
    - Enable RLS on `employees` table
    - Add policies for authenticated users to manage their own employee records
    - Users can only access employees they created (filtered by user_id)

  3. Changes
    - Creates the employees table with all necessary columns and constraints
    - Sets up proper foreign key relationship with auth.users
    - Establishes RLS policies for data security
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  hourly_rate numeric NOT NULL DEFAULT 0,
  overtime_rate numeric NOT NULL DEFAULT 0,
  position text NOT NULL,
  department text NOT NULL,
  hire_date date NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS employees_user_id_idx ON employees(user_id);
CREATE INDEX IF NOT EXISTS employees_is_active_idx ON employees(is_active);
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees(department);