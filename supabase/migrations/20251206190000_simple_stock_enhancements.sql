-- Simple Stock Management Enhancements
-- Aligns with TeaBuddy Pro's practical requirements

-- Update stock table to ensure it has all required columns
-- (Some may already exist from previous migration)

-- Add missing columns if they don't exist
ALTER TABLE public.stock 
  ADD COLUMN IF NOT EXISTS low_stock_thr NUMERIC DEFAULT 10;

-- Update the category to support all 4 types
-- Raw Materials, Resale Items, Beverage, Snack
COMMENT ON COLUMN public.stock.category IS 'Category: Raw Materials, Resale Items, Beverage, Snack';

-- Ensure vendor column exists (it already does as 'vendor')
-- This is vendor name as text, not a foreign key

-- Create a simple view for stock with status
CREATE OR REPLACE VIEW public.stock_with_status AS
SELECT 
  s.*,
  CASE 
    WHEN s.closing_stock = 0 THEN 'OUT_OF_STOCK'
    WHEN s.closing_stock <= s.low_stock_thr THEN 'LOW_STOCK'
    ELSE 'OK'
  END as stock_status,
  CASE
    WHEN s.expiry_date IS NOT NULL AND s.expiry_date <= CURRENT_DATE THEN TRUE
    ELSE FALSE
  END as is_expired,
  CASE
    WHEN s.expiry_date IS NOT NULL 
      AND s.expiry_date > CURRENT_DATE 
      AND s.expiry_date <= CURRENT_DATE + INTERVAL '7 days' 
    THEN TRUE
    ELSE FALSE
  END as expiring_soon,
  s.closing_stock * s.purchase_price as stock_value
FROM public.stock s;

COMMENT ON VIEW public.stock_with_status IS 'Stock with calculated status flags';

-- Create a simple function to get vendor-wise spending
CREATE OR REPLACE FUNCTION get_vendor_spending(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  vendor_name TEXT,
  total_purchase_value NUMERIC,
  total_items INTEGER,
  avg_purchase_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.vendor,
    SUM(st.quantity * COALESCE(s.purchase_price, 0)) as total_purchase_value,
    COUNT(DISTINCT s.id)::INTEGER as total_items,
    AVG(s.purchase_price) as avg_purchase_price
  FROM public.stock s
  JOIN public.stock_transactions st ON s.id = st.stock_id
  WHERE 
    s.vendor IS NOT NULL
    AND st.transaction_type IN ('purchase')
    AND (start_date IS NULL OR st.created_at::DATE >= start_date)
    AND (end_date IS NULL OR st.created_at::DATE <= end_date)
  GROUP BY s.vendor
  ORDER BY total_purchase_value DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_vendor_spending IS 'Get spending analysis by vendor';

-- Create function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id UUID,
  product_name TEXT,
  category TEXT,
  vendor TEXT,
  closing_stock NUMERIC,
  low_stock_thr NUMERIC,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.product_name,
    s.category,
    s.vendor,
    s.closing_stock,
    s.low_stock_thr,
    s.unit
  FROM public.stock s
  WHERE s.closing_stock <= s.low_stock_thr
  ORDER BY s.closing_stock ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_low_stock_items IS 'Get all items with low stock';

-- Create function to get expiring items
CREATE OR REPLACE FUNCTION get_expiring_items(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  product_name TEXT,
  category TEXT,
  vendor TEXT,
  closing_stock NUMERIC,
  expiry_date DATE,
  days_to_expiry INTEGER,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.product_name,
    s.category,
    s.vendor,
    s.closing_stock,
    s.expiry_date,
    (s.expiry_date - CURRENT_DATE)::INTEGER as days_to_expiry,
    s.unit
  FROM public.stock s
  WHERE 
    s.expiry_date IS NOT NULL
    AND s.closing_stock > 0
    AND s.expiry_date <= CURRENT_DATE + days_ahead
  ORDER BY s.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_expiring_items IS 'Get items expiring within specified days';

-- Create function for stock valuation by category
CREATE OR REPLACE FUNCTION get_stock_valuation()
RETURNS TABLE (
  category TEXT,
  total_items INTEGER,
  total_quantity NUMERIC,
  purchase_value NUMERIC,
  selling_value NUMERIC,
  potential_profit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.category,
    COUNT(*)::INTEGER as total_items,
    SUM(s.closing_stock) as total_quantity,
    SUM(s.closing_stock * s.purchase_price) as purchase_value,
    SUM(s.closing_stock * s.selling_price) as selling_value,
    SUM(s.closing_stock * (s.selling_price - s.purchase_price)) as potential_profit
  FROM public.stock s
  GROUP BY s.category
  ORDER BY purchase_value DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_stock_valuation IS 'Get inventory valuation by category';

-- Update the existing categories in stock table to match the 4 types
-- This is a helper to ensure consistency
DO $$
BEGIN
  -- Update any existing "Raw Materials" to match exactly
  UPDATE public.stock 
  SET category = 'Raw Materials' 
  WHERE category ILIKE '%raw%';
  
  -- Update any existing "Resale Items" to match exactly
  UPDATE public.stock 
  SET category = 'Resale Items' 
  WHERE category ILIKE '%resale%';
END $$;
