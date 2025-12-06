-- Enhanced Stock Management System Migration
-- Phase 1: Foundation Enhancements

-- 1. Create Suppliers/Vendors table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add SKU and supplier reference to stock table
ALTER TABLE public.stock 
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_stock_level NUMERIC;

-- 3. Create Stock Ledger (Audit Trail) - immutable transaction log
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'IN' or 'OUT'
  transaction_subtype TEXT, -- 'PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY'
  quantity NUMERIC NOT NULL,
  before_stock NUMERIC NOT NULL,
  after_stock NUMERIC NOT NULL,
  unit_price NUMERIC,
  transaction_value NUMERIC, -- quantity × unit_price
  reference_id UUID, -- Reference to stock_transactions.id
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Stock Alerts table (persistent)
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED'
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'error'
  is_active BOOLEAN DEFAULT TRUE,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Price History table
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
  price_type TEXT NOT NULL, -- 'PURCHASE' or 'SELLING'
  old_price NUMERIC,
  new_price NUMERIC NOT NULL,
  changed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enhanced stock_transactions with more details
ALTER TABLE public.stock_transactions
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS total_value NUMERIC,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Enable RLS on new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create policies (open access for now)
CREATE POLICY "Allow all on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_ledger" ON public.stock_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_alerts" ON public.stock_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_history" ON public.price_history FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_sku ON public.stock(sku);
CREATE INDEX IF NOT EXISTS idx_stock_supplier ON public.stock(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_barcode ON public.stock(barcode);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_stock ON public.stock_ledger(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_date ON public.stock_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_stock ON public.stock_alerts(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON public.stock_alerts(is_active, is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_price_history_stock ON public.price_history(stock_id);

-- Apply updated_at trigger to suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate SKU automatically if not provided
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL THEN
    NEW.sku := 'SKU-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_stock_sku
  BEFORE INSERT ON public.stock
  FOR EACH ROW
  EXECUTE FUNCTION generate_sku();

-- Function to create ledger entry and check alerts on stock transactions
CREATE OR REPLACE FUNCTION process_stock_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_stock RECORD;
  v_before_stock NUMERIC;
  v_after_stock NUMERIC;
BEGIN
  -- Get current stock info
  SELECT * INTO v_stock FROM public.stock WHERE id = NEW.stock_id;
  
  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Stock item not found';
  END IF;
  
  v_before_stock := v_stock.closing_stock;
  
  -- Determine transaction direction and update stock
  IF NEW.transaction_type IN ('purchase', 'adjustment_in', 'return') THEN
    -- Stock IN
    UPDATE public.stock 
    SET purchased_qty = purchased_qty + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.stock_id;
    
    v_after_stock := v_before_stock + NEW.quantity;
    
    -- Create ledger entry
    INSERT INTO public.stock_ledger (
      stock_id, transaction_type, transaction_subtype, quantity,
      before_stock, after_stock, unit_price, transaction_value, reference_id, user_notes
    ) VALUES (
      NEW.stock_id, 'IN', NEW.transaction_type, NEW.quantity,
      v_before_stock, v_after_stock, NEW.unit_price, 
      NEW.quantity * COALESCE(NEW.unit_price, 0), NEW.id, NEW.notes
    );
    
    -- Clear low stock alerts if stock is now adequate
    IF v_after_stock > v_stock.low_stock_threshold THEN
      UPDATE public.stock_alerts
      SET is_active = FALSE
      WHERE stock_id = NEW.stock_id 
        AND alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')
        AND is_active = TRUE;
    END IF;
    
  ELSIF NEW.transaction_type IN ('use', 'sale', 'adjustment_out', 'damage', 'expired') THEN
    -- Stock OUT
    IF v_before_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_before_stock, NEW.quantity;
    END IF;
    
    UPDATE public.stock 
    SET used_sold_qty = used_sold_qty + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.stock_id;
    
    v_after_stock := v_before_stock - NEW.quantity;
    
    -- Create ledger entry
    INSERT INTO public.stock_ledger (
      stock_id, transaction_type, transaction_subtype, quantity,
      before_stock, after_stock, unit_price, transaction_value, reference_id, user_notes
    ) VALUES (
      NEW.stock_id, 'OUT', NEW.transaction_type, NEW.quantity,
      v_before_stock, v_after_stock, NEW.unit_price,
      NEW.quantity * COALESCE(NEW.unit_price, 0), NEW.id, NEW.notes
    );
    
    -- Create alert if stock is low
    IF v_after_stock = 0 THEN
      INSERT INTO public.stock_alerts (stock_id, alert_type, message, severity)
      VALUES (
        NEW.stock_id, 'OUT_OF_STOCK',
        v_stock.product_name || ' is out of stock!',
        'error'
      );
    ELSIF v_after_stock <= v_stock.low_stock_threshold THEN
      INSERT INTO public.stock_alerts (stock_id, alert_type, message, severity)
      VALUES (
        NEW.stock_id, 'LOW_STOCK',
        v_stock.product_name || ' is low on stock (' || v_after_stock || ' ' || v_stock.unit || ' remaining)',
        'warning'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock transactions
DROP TRIGGER IF EXISTS trigger_process_stock_transaction ON public.stock_transactions;
CREATE TRIGGER trigger_process_stock_transaction
  AFTER INSERT ON public.stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_stock_transaction();

-- Function to track price changes
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track purchase price changes
  IF OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN
    INSERT INTO public.price_history (stock_id, price_type, old_price, new_price)
    VALUES (NEW.id, 'PURCHASE', OLD.purchase_price, NEW.purchase_price);
  END IF;
  
  -- Track selling price changes
  IF OLD.selling_price IS DISTINCT FROM NEW.selling_price THEN
    INSERT INTO public.price_history (stock_id, price_type, old_price, new_price)
    VALUES (NEW.id, 'SELLING', OLD.selling_price, NEW.selling_price);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price tracking
DROP TRIGGER IF EXISTS trigger_track_price_changes ON public.stock;
CREATE TRIGGER trigger_track_price_changes
  AFTER UPDATE ON public.stock
  FOR EACH ROW
  WHEN (OLD.purchase_price IS DISTINCT FROM NEW.purchase_price 
        OR OLD.selling_price IS DISTINCT FROM NEW.selling_price)
  EXECUTE FUNCTION track_price_changes();

-- Function to check expiring items (run periodically)
CREATE OR REPLACE FUNCTION check_expiring_items()
RETURNS void AS $$
DECLARE
  v_stock RECORD;
  v_days_until_expiry INTEGER;
BEGIN
  -- Clear old expiry alerts
  UPDATE public.stock_alerts
  SET is_active = FALSE
  WHERE alert_type IN ('EXPIRING_SOON', 'EXPIRED') AND is_active = TRUE;
  
  -- Check all items with expiry dates
  FOR v_stock IN 
    SELECT * FROM public.stock 
    WHERE expiry_date IS NOT NULL AND closing_stock > 0
  LOOP
    v_days_until_expiry := v_stock.expiry_date - CURRENT_DATE;
    
    IF v_days_until_expiry < 0 THEN
      -- Expired
      INSERT INTO public.stock_alerts (stock_id, alert_type, message, severity)
      VALUES (
        v_stock.id, 'EXPIRED',
        v_stock.product_name || ' has expired!',
        'error'
      );
    ELSIF v_days_until_expiry <= 7 THEN
      -- Expiring soon (within 7 days)
      INSERT INTO public.stock_alerts (stock_id, alert_type, message, severity)
      VALUES (
        v_stock.id, 'EXPIRING_SOON',
        v_stock.product_name || ' expiring in ' || v_days_until_expiry || ' days',
        'warning'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create view for stock summary with alerts
CREATE OR REPLACE VIEW stock_summary AS
SELECT 
  s.*,
  sup.name as supplier_name,
  sup.phone as supplier_phone,
  s.closing_stock * s.purchase_price as stock_value,
  CASE 
    WHEN s.closing_stock = 0 THEN 'OUT_OF_STOCK'
    WHEN s.closing_stock <= s.low_stock_threshold THEN 'LOW_STOCK'
    WHEN s.closing_stock >= s.max_stock_level THEN 'OVERSTOCK'
    ELSE 'ADEQUATE'
  END as stock_status,
  (SELECT COUNT(*) FROM stock_alerts WHERE stock_id = s.id AND is_active = TRUE) as active_alerts_count
FROM public.stock s
LEFT JOIN public.suppliers sup ON s.supplier_id = sup.id;

COMMENT ON TABLE public.suppliers IS 'Supplier/Vendor master data';
COMMENT ON TABLE public.stock_ledger IS 'Immutable audit trail of all stock movements';
COMMENT ON TABLE public.stock_alerts IS 'Persistent stock alerts (low stock, expiry, etc)';
COMMENT ON TABLE public.price_history IS 'History of price changes for audit';
