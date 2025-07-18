/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `description` (text, expense description)
      - `amount` (numeric, expense amount)
      - `category` (text, expense category)
      - `date` (date, expense date)
      - `receipt_url` (text, optional receipt URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for authenticated users to manage their own expenses

  3. Indexes
    - Add indexes for user_id, category, and date for better query performance
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL,
  date date NOT NULL,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses(created_at);