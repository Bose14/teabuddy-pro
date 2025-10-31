-- Create stock management table
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  opening_stock NUMERIC NOT NULL DEFAULT 0,
  stock_in NUMERIC NOT NULL DEFAULT 0,
  stock_out NUMERIC NOT NULL DEFAULT 0,
  remaining NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milk usage tracker table
CREATE TABLE public.milk_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  purchased NUMERIC NOT NULL DEFAULT 0,
  used NUMERIC NOT NULL DEFAULT 0,
  remaining NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pending bills table
CREATE TABLE public.pending_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_bills ENABLE ROW LEVEL SECURITY;

-- Create policies for stock table
CREATE POLICY "Allow all operations on stock"
ON public.stock
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for milk_usage table
CREATE POLICY "Allow all operations on milk_usage"
ON public.milk_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for pending_bills table
CREATE POLICY "Allow all operations on pending_bills"
ON public.pending_bills
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_stock_date ON public.stock(date);
CREATE INDEX idx_milk_usage_date ON public.milk_usage(date);
CREATE INDEX idx_pending_bills_status ON public.pending_bills(status);
CREATE INDEX idx_pending_bills_due_date ON public.pending_bills(due_date);