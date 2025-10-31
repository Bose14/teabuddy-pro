-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit NUMERIC(10, 2) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'GPay', 'PhonePe')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('Cash', 'GPay', 'PhonePe', 'Pending')),
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending')) DEFAULT 'Paid',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (allow all operations for now since no auth)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (no auth required for first version)
CREATE POLICY "Allow all operations on sales" 
ON public.sales 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on expenses" 
ON public.expenses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_expenses_date ON public.expenses(date);