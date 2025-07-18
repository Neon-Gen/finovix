/*
  # Create purchase orders table

  1. New Tables
    - `purchase_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `po_number` (text, purchase order number)
      - `supplier_name` (text, supplier name)
      - `supplier_email` (text, supplier email)
      - `supplier_phone` (text, supplier phone)
      - `supplier_address` (text, supplier address)
      - `order_date` (date, order date)
      - `expected_delivery_date` (date, expected delivery)
      - `actual_delivery_date` (date, actual delivery)
      - `items` (jsonb, ordered items)
      - `subtotal` (numeric, subtotal amount)
      - `tax_amount` (numeric, tax amount)
      - `shipping_cost` (numeric, shipping cost)
      - `total_amount` (numeric, total amount)
      - `status` (text, order status)
      - `payment_terms` (text, payment terms)
      - `payment_status` (text, payment status)
      - `notes` (text, additional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `purchase_orders` table
    - Add policies for authenticated users to manage their own purchase orders

  3. Indexes
    - Add indexes for user_id, po_number, and status for better query performance
*/

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_name text NOT NULL,
  supplier_email text DEFAULT '',
  supplier_phone text DEFAULT '',
  supplier_address text DEFAULT '',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  actual_delivery_date date,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'draft',
  payment_terms text DEFAULT 'net_30',
  payment_status text DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchase orders"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase orders"
  ON purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
  ON purchase_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
  ON purchase_orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS purchase_orders_user_id_idx ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS purchase_orders_po_number_idx ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS purchase_orders_order_date_idx ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS purchase_orders_expected_delivery_date_idx ON purchase_orders(expected_delivery_date);

-- Create unique constraint for po_number per user
CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_user_po_number_unique 
  ON purchase_orders(user_id, po_number);

-- Create trigger for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for status
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled', 'returned'));

-- Add constraint for payment terms
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_payment_terms_check 
  CHECK (payment_terms IN ('immediate', 'net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'cod', 'advance'));

-- Add constraint for payment status
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled'));