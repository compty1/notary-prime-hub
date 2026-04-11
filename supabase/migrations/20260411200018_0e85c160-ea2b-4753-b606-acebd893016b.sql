
-- DB-005: Financial/Expense Tracking Tables

-- 1. Expense Categories (IRS Schedule C mapping)
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL,
  irs_schedule_c_line TEXT,
  is_deductible BOOLEAN NOT NULL DEFAULT true,
  parent_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expense categories"
  ON public.expense_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed common notary expense categories
INSERT INTO public.expense_categories (category_name, irs_schedule_c_line, is_deductible) VALUES
  ('Office Supplies', 'Line 22', true),
  ('Bond Premium', 'Line 15 (Insurance)', true),
  ('E&O Insurance', 'Line 15 (Insurance)', true),
  ('Technology/Software', 'Line 18 (Office Expense)', true),
  ('Marketing & Advertising', 'Line 8', true),
  ('Travel - Mileage', 'Line 9 (Car)', true),
  ('Travel - Tolls & Parking', 'Line 9 (Car)', true),
  ('Professional Development', 'Line 27a (Other)', true),
  ('Continuing Education', 'Line 27a (Other)', true),
  ('Equipment', 'Line 13 (Depreciation)', true),
  ('Commission Fee', 'Line 17 (Legal/Prof Services)', true),
  ('Notary Supplies (Stamps/Seals)', 'Line 22', true),
  ('Printing & Copying', 'Line 18 (Office Expense)', true),
  ('Phone & Internet', 'Line 25 (Utilities)', true),
  ('Background Check / Fingerprinting', 'Line 27a (Other)', true);

-- 2. Financial Transactions (master ledger)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  category_id UUID REFERENCES public.expense_categories(id),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  vendor TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial transactions"
  ON public.financial_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Recurring Expenses
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_due DATE NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  is_active BOOLEAN DEFAULT true,
  vendor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurring expenses"
  ON public.recurring_expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Amortized Expenses
CREATE TABLE public.amortized_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  annual_amount NUMERIC(10,2) NOT NULL,
  monthly_amount NUMERIC(10,2) GENERATED ALWAYS AS (annual_amount / 12) STORED,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.amortized_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage amortized expenses"
  ON public.amortized_expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Mileage Logs
CREATE TABLE public.mileage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  miles NUMERIC(6,1) NOT NULL,
  purpose TEXT,
  irs_rate NUMERIC(4,3) NOT NULL DEFAULT 0.700,
  total_deduction NUMERIC(10,2) GENERATED ALWAYS AS (miles * irs_rate) STORED,
  appointment_id UUID REFERENCES public.appointments(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mileage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mileage logs"
  ON public.mileage_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category_id);
CREATE INDEX idx_mileage_logs_date ON public.mileage_logs(trip_date);
CREATE INDEX idx_recurring_expenses_next_due ON public.recurring_expenses(next_due);
