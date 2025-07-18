/*
  # Create assets table

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text, asset name)
      - `description` (text, asset description)
      - `category` (text, asset category)
      - `purchase_date` (date, when asset was purchased)
      - `purchase_price` (numeric, original cost)
      - `current_value` (numeric, current market value)
      - `depreciation_method` (text, depreciation method)
      - `depreciation_rate` (numeric, annual depreciation rate)
      - `useful_life_years` (integer, expected useful life)
      - `salvage_value` (numeric, expected salvage value)
      - `location` (text, where asset is located)
      - `condition` (text, current condition)
      - `serial_number` (text, asset serial number)
      - `warranty_expiry` (date, warranty expiration)
      - `maintenance_schedule` (text, maintenance requirements)
      - `is_active` (boolean, whether asset is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `assets` table
    - Add policies for authenticated users to manage their own assets

  3. Indexes
    - Add indexes for user_id, category, and purchase_date for better query performance
*/

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  purchase_date date NOT NULL,
  purchase_price numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  depreciation_method text DEFAULT 'straight_line',
  depreciation_rate numeric DEFAULT 0,
  useful_life_years integer DEFAULT 5,
  salvage_value numeric DEFAULT 0,
  location text DEFAULT '',
  condition text DEFAULT 'good',
  serial_number text DEFAULT '',
  warranty_expiry date,
  maintenance_schedule text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON assets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);
CREATE INDEX IF NOT EXISTS assets_category_idx ON assets(category);
CREATE INDEX IF NOT EXISTS assets_purchase_date_idx ON assets(purchase_date);
CREATE INDEX IF NOT EXISTS assets_is_active_idx ON assets(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();