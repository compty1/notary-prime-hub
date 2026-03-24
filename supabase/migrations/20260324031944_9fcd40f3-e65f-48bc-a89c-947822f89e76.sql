
-- Add OneNotary fee tracking columns to notary_journal
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS onenotary_fee numeric DEFAULT 0;
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS notary_payout numeric DEFAULT 0;
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS platform_markup numeric DEFAULT 0;

-- Create notary payouts table for tracking disbursements
CREATE TABLE IF NOT EXISTS public.notary_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notary_user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric NOT NULL DEFAULT 0,
  platform_fees numeric NOT NULL DEFAULT 0,
  onenotary_fees numeric NOT NULL DEFAULT 0,
  net_payout numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.notary_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payouts" ON public.notary_payouts FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Notaries view own payouts" ON public.notary_payouts FOR SELECT TO authenticated USING (auth.uid() = notary_user_id);
