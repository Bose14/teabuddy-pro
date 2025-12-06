-- Function to sync expenses with daily_cash_flow
CREATE OR REPLACE FUNCTION sync_expenses_to_daily_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  affected_date DATE;
  cash_exp DECIMAL;
  online_exp DECIMAL;
  total_exp DECIMAL;
BEGIN
  -- Determine the affected date
  IF TG_OP = 'DELETE' THEN
    affected_date := OLD.date;
  ELSE
    affected_date := NEW.date;
  END IF;

  -- Calculate expense totals for the affected date
  SELECT 
    COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_method = 'Online' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO cash_exp, online_exp, total_exp
  FROM expenses
  WHERE date = affected_date;

  -- Update or insert into daily_cash_flow
  INSERT INTO daily_cash_flow (
    date,
    yesterday_cash,
    cash_sales,
    online_sales,
    closing_cash,
    cash_expenses,
    online_expenses,
    total_expenses,
    notes
  )
  VALUES (
    affected_date,
    0,
    0,
    0,
    0,
    cash_exp,
    online_exp,
    total_exp,
    NULL
  )
  ON CONFLICT (date) 
  DO UPDATE SET
    cash_expenses = cash_exp,
    online_expenses = online_exp,
    total_expenses = total_exp,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
CREATE TRIGGER expenses_insert_sync
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_expenses_to_daily_cash_flow();

-- Create trigger for UPDATE
CREATE TRIGGER expenses_update_sync
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.date IS DISTINCT FROM NEW.date OR OLD.amount IS DISTINCT FROM NEW.amount OR OLD.payment_method IS DISTINCT FROM NEW.payment_method)
  EXECUTE FUNCTION sync_expenses_to_daily_cash_flow();

-- Create trigger for DELETE
CREATE TRIGGER expenses_delete_sync
  AFTER DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_expenses_to_daily_cash_flow();

-- Helper function to sync a specific date
CREATE OR REPLACE FUNCTION sync_expenses_to_daily_cash_flow_for_date(sync_date DATE)
RETURNS VOID AS $$
DECLARE
  cash_exp DECIMAL;
  online_exp DECIMAL;
  total_exp DECIMAL;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_method = 'Online' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO cash_exp, online_exp, total_exp
  FROM expenses
  WHERE date = sync_date;

  INSERT INTO daily_cash_flow (
    date,
    yesterday_cash,
    cash_sales,
    online_sales,
    closing_cash,
    cash_expenses,
    online_expenses,
    total_expenses,
    notes
  )
  VALUES (
    sync_date,
    0,
    0,
    0,
    0,
    cash_exp,
    online_exp,
    total_exp,
    NULL
  )
  ON CONFLICT (date) 
  DO UPDATE SET
    cash_expenses = cash_exp,
    online_expenses = online_exp,
    total_expenses = total_exp,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to handle date changes
CREATE OR REPLACE FUNCTION sync_expenses_on_date_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    PERFORM sync_expenses_to_daily_cash_flow_for_date(OLD.date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for date changes
CREATE TRIGGER expenses_date_change_sync
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.date IS DISTINCT FROM NEW.date)
  EXECUTE FUNCTION sync_expenses_on_date_change();
