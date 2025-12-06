-- Drop existing tables to rebuild with new schema
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.stock CASCADE;
DROP TABLE IF EXISTS public.milk_usage CASCADE;
DROP TABLE IF EXISTS public.pending_bills CASCADE;

-- Create expense types enum
CREATE TYPE public.expense_type AS ENUM (
  'Milk', 'Oil', 'Sugar', 'Vegetables', 'Salary', 'Rent', 'Electricity', 'Gas', 'Others'
);

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('Cash', 'Online');

-- Create stock category enum
CREATE TYPE public.stock_category AS ENUM ('Raw Materials', 'Resale Items');

-- Daily Cash Flow table
CREATE TABLE public.daily_cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  yesterday_cash NUMERIC NOT NULL DEFAULT 0,
  cash_sales NUMERIC NOT NULL DEFAULT 0,
  online_sales NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  cash_expenses NUMERIC NOT NULL DEFAULT 0,
  online_expenses NUMERIC NOT NULL DEFAULT 0,
  closing_cash NUMERIC NOT NULL DEFAULT 0,
  daily_sales NUMERIC GENERATED ALWAYS AS (closing_cash + online_sales + total_expenses - yesterday_cash) STORED,
  daily_profit NUMERIC GENERATED ALWAYS AS (closing_cash + online_sales + total_expenses - yesterday_cash - total_expenses) STORED,
  expected_closing_cash NUMERIC GENERATED ALWAYS AS (yesterday_cash + cash_sales - cash_expenses) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table (enhanced)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  vendor_name TEXT,
  notes TEXT,
  is_salary_payment BOOLEAN DEFAULT FALSE,
  employee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees/Salary table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  monthly_salary NUMERIC NOT NULL DEFAULT 0,
  advance_given NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salary payments table
CREATE TABLE public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'Salary',
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock table (enhanced)
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  opening_stock NUMERIC NOT NULL DEFAULT 0,
  purchased_qty NUMERIC NOT NULL DEFAULT 0,
  used_sold_qty NUMERIC NOT NULL DEFAULT 0,
  closing_stock NUMERIC GENERATED ALWAYS AS (opening_stock + purchased_qty - used_sold_qty) STORED,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock transactions for history
CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (open access for now, auth to be added later)
CREATE POLICY "Allow all on daily_cash_flow" ON public.daily_cash_flow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on salary_payments" ON public.salary_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_daily_cash_flow_date ON public.daily_cash_flow(date);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_type ON public.expenses(expense_type);
CREATE INDEX idx_stock_category ON public.stock(category);
CREATE INDEX idx_salary_payments_employee ON public.salary_payments(employee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_daily_cash_flow_updated_at
  BEFORE UPDATE ON public.daily_cash_flow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
  BEFORE UPDATE ON public.stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();