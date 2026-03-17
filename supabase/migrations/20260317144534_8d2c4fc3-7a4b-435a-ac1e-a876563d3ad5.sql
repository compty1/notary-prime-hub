-- Allow anonymous inserts for loan_signing_inquiry source
CREATE POLICY "Allow anonymous loan signing inquiries"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  source = 'loan_signing_inquiry'
  AND status = 'new'
  AND lead_type = 'business'
);