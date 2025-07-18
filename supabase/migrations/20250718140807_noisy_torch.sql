/*
  # Create inventory table for PVC pipe manufacturing

  1. New Tables
    - `inventory`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `item_code` (text, unique item identifier)
      - `item_name` (text, product name)
      - `description` (text, item description)
      - `category` (text, product category)
      - `unit_of_measure` (text, measurement unit)
      - `current_stock` (numeric, current quantity)
      - `minimum_stock` (numeric, reorder level)
      - `maximum_stock` (numeric, maximum stock level)
      - `reorder_quantity` (numeric, quantity to reorder)
      - `unit_cost` (numeric, cost per unit)
      - `selling_price` (numeric, selling price per unit)
      - `supplier_name` (text, primary supplier)
      - `supplier_contact` (text, supplier contact info)
      - `location` (text, storage location)
      - `last_purchase_date` (date, last purchase date)
      - `last_sale_date` (date, last sale date)
      - `expiry_date` (date, expiry date if applicable)
      - `batch_number` (text, batch/lot number)
      - `quality_grade` (text, quality classification)
      - `is_active` (boolean, whether item is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `inventory` table
    - Add policies for authenticated users to manage their own inventory

  3. Indexes
    - Add indexes for user_id, category, and stock levels for better query performance
*/

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  unit_of_measure text DEFAULT 'pieces',
  current_stock numeric DEFAULT 0,
  minimum_stock numeric DEFAULT 0,
  maximum_stock numeric DEFAULT 0,
  reorder_quantity numeric DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  selling_price numeric DEFAULT 0,
  supplier_name text DEFAULT '',
  supplier_contact text DEFAULT '',
  location text DEFAULT '',
  last_purchase_date date,
  last_sale_date date,
  expiry_date date,
  batch_number text DEFAULT '',
  quality_grade text DEFAULT 'standard',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
  ON inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON inventory
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON inventory
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS inventory_user_id_idx ON inventory(user_id);
CREATE INDEX IF NOT EXISTS inventory_item_code_idx ON inventory(item_code);
CREATE INDEX IF NOT EXISTS inventory_category_idx ON inventory(category);
CREATE INDEX IF NOT EXISTS inventory_current_stock_idx ON inventory(current_stock);
CREATE INDEX IF NOT EXISTS inventory_minimum_stock_idx ON inventory(minimum_stock);
CREATE INDEX IF NOT EXISTS inventory_is_active_idx ON inventory(is_active);

-- Create unique constraint for item_code per user
CREATE UNIQUE INDEX IF NOT EXISTS inventory_user_item_code_unique 
  ON inventory(user_id, item_code);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for unit of measure
ALTER TABLE inventory ADD CONSTRAINT inventory_unit_of_measure_check 
  CHECK (unit_of_measure IN ('pieces', 'meters', 'kilograms', 'liters', 'tons', 'boxes', 'rolls', 'sheets'));

-- Add constraint for quality grade
ALTER TABLE inventory ADD CONSTRAINT inventory_quality_grade_check 
  CHECK (quality_grade IN ('premium', 'standard', 'economy', 'defective', 'returned'));