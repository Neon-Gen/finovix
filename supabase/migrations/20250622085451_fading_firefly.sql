/*
  # Create bills table

  1. New Tables
    - `bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bill_number` (text, unique bill identifier)
      - `customer_name` (text, customer name)
      - `customer_email` (text, customer email)
      - `customer_phone` (text, customer phone)
      - `items` (jsonb, bill line items)
      - `subtotal` (numeric, subtotal amount)
      - `tax_amount` (numeric, tax amount)
      - `total_amount` (numeric, total amount)
      - `status` (text, bill status)
      - `created_at` (timestamp)
      - `due_date` (date, payment due date)

  2. Security
    - Enable RLS on `bills` table
    - Add policies for authenticated users to manage their own bills

  3. Indexes
    - Add indexes for optimal query performance
*/

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bill_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  customer_phone text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  due_date date NOT NULL,
  CONSTRAINT bills_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT bills_status_check CHECK (status IN ('draft', 'sent', 'paid', 'overdue'))
);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bills"
  ON bills
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
CREATE INDEX IF NOT EXISTS bills_created_at_idx ON bills(created_at);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
CREATE INDEX IF NOT EXISTS bills_bill_number_idx ON bills(bill_number);