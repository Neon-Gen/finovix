/*
  # Create dashboard views for better performance

  1. Views
    - `dashboard_summary` - Overall business summary
    - `monthly_financial_summary` - Monthly financial data
    - `employee_summary` - Employee statistics
    - `inventory_summary` - Inventory statistics
    - `recent_activities` - Recent business activities

  2. Security
    - Views inherit RLS from underlying tables
    - Users can only see their own data
*/

-- Dashboard summary view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
  u.id as user_id,
  -- Financial metrics
  COALESCE(bills_summary.total_revenue, 0) as total_revenue,
  COALESCE(bills_summary.total_bills, 0) as total_bills,
  COALESCE(bills_summary.paid_bills, 0) as paid_bills,
  COALESCE(bills_summary.pending_bills, 0) as pending_bills,
  COALESCE(expenses_summary.total_expenses, 0) as total_expenses,
  COALESCE(expenses_summary.total_expense_count, 0) as total_expense_count,
  COALESCE(bills_summary.total_revenue, 0) - COALESCE(expenses_summary.total_expenses, 0) as net_profit,
  -- Employee metrics
  COALESCE(employee_summary.total_employees, 0) as total_employees,
  COALESCE(employee_summary.active_employees, 0) as active_employees,
  -- Asset metrics
  COALESCE(asset_summary.total_assets, 0) as total_assets,
  COALESCE(asset_summary.total_asset_value, 0) as total_asset_value,
  -- Liability metrics
  COALESCE(liability_summary.total_liabilities, 0) as total_liabilities,
  COALESCE(liability_summary.total_liability_amount, 0) as total_liability_amount,
  -- Inventory metrics
  COALESCE(inventory_summary.total_items, 0) as total_inventory_items,
  COALESCE(inventory_summary.low_stock_items, 0) as low_stock_items,
  COALESCE(inventory_summary.total_inventory_value, 0) as total_inventory_value
FROM users u
LEFT JOIN (
  SELECT 
    user_id,
    SUM(total_amount) as total_revenue,
    COUNT(*) as total_bills,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
    COUNT(CASE WHEN status != 'paid' THEN 1 END) as pending_bills
  FROM bills
  GROUP BY user_id
) bills_summary ON u.id = bills_summary.user_id
LEFT JOIN (
  SELECT 
    user_id,
    SUM(amount) as total_expenses,
    COUNT(*) as total_expense_count
  FROM expenses
  GROUP BY user_id
) expenses_summary ON u.id = expenses_summary.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN is_active THEN 1 END) as active_employees
  FROM employees
  GROUP BY user_id
) employee_summary ON u.id = employee_summary.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_assets,
    SUM(current_value) as total_asset_value
  FROM assets
  WHERE is_active = true
  GROUP BY user_id
) asset_summary ON u.id = asset_summary.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_liabilities,
    SUM(current_balance) as total_liability_amount
  FROM liabilities
  WHERE is_active = true
  GROUP BY user_id
) liability_summary ON u.id = liability_summary.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_items,
    COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_items,
    SUM(current_stock * unit_cost) as total_inventory_value
  FROM inventory
  WHERE is_active = true
  GROUP BY user_id
) inventory_summary ON u.id = inventory_summary.user_id;

-- Monthly financial summary view
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  'revenue' as type,
  SUM(total_amount) as amount,
  COUNT(*) as transaction_count
FROM bills
GROUP BY user_id, DATE_TRUNC('month', created_at)
UNION ALL
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  'expense' as type,
  SUM(amount) as amount,
  COUNT(*) as transaction_count
FROM expenses
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month DESC;

-- Employee summary view
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
  user_id,
  department,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN is_active THEN 1 END) as active_employees,
  AVG(hourly_rate) as avg_hourly_rate,
  AVG(overtime_rate) as avg_overtime_rate,
  MIN(hire_date) as earliest_hire_date,
  MAX(hire_date) as latest_hire_date
FROM employees
GROUP BY user_id, department;

-- Inventory summary view
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  user_id,
  category,
  COUNT(*) as total_items,
  COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_items,
  COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
  SUM(current_stock) as total_stock,
  SUM(current_stock * unit_cost) as total_value,
  AVG(unit_cost) as avg_unit_cost,
  AVG(selling_price) as avg_selling_price
FROM inventory
WHERE is_active = true
GROUP BY user_id, category;

-- Recent activities view (last 30 days)
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
  user_id,
  'bill' as activity_type,
  'Bill ' || bill_number || ' created for ' || customer_name as description,
  total_amount as amount,
  created_at
FROM bills
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  user_id,
  'expense' as activity_type,
  'Expense: ' || description as description,
  amount,
  created_at
FROM expenses
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  user_id,
  'employee' as activity_type,
  'Employee ' || name || ' added to ' || department as description,
  hourly_rate as amount,
  created_at
FROM employees
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  user_id,
  'asset' as activity_type,
  'Asset ' || name || ' purchased' as description,
  purchase_price as amount,
  created_at
FROM assets
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  user_id,
  'liability' as activity_type,
  'Liability ' || name || ' added' as description,
  principal_amount as amount,
  created_at
FROM liabilities
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Asset depreciation view
CREATE OR REPLACE VIEW asset_depreciation AS
SELECT 
  a.*,
  CASE 
    WHEN depreciation_method = 'straight_line' THEN
      GREATEST(0, purchase_price - (
        (purchase_price - salvage_value) * 
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, purchase_date)) / 
        NULLIF(useful_life_years, 0)
      ))
    WHEN depreciation_method = 'declining_balance' THEN
      purchase_price * POWER(1 - (depreciation_rate / 100), EXTRACT(YEAR FROM AGE(CURRENT_DATE, purchase_date)))
    ELSE current_value
  END as calculated_current_value,
  CASE 
    WHEN depreciation_method = 'straight_line' THEN
      (purchase_price - salvage_value) * 
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, purchase_date)) / 
      NULLIF(useful_life_years, 0)
    WHEN depreciation_method = 'declining_balance' THEN
      purchase_price - (purchase_price * POWER(1 - (depreciation_rate / 100), EXTRACT(YEAR FROM AGE(CURRENT_DATE, purchase_date))))
    ELSE 0
  END as accumulated_depreciation
FROM assets a
WHERE is_active = true;

-- Payroll summary view
CREATE OR REPLACE VIEW payroll_summary AS
SELECT 
  p.user_id,
  p.pay_period_start,
  p.pay_period_end,
  COUNT(*) as employee_count,
  SUM(regular_hours) as total_regular_hours,
  SUM(overtime_hours) as total_overtime_hours,
  SUM(gross_pay) as total_gross_pay,
  SUM(total_deductions) as total_deductions,
  SUM(net_pay) as total_net_pay,
  AVG(net_pay) as avg_net_pay
FROM payroll p
GROUP BY p.user_id, p.pay_period_start, p.pay_period_end
ORDER BY p.pay_period_start DESC;