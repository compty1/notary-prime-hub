CREATE POLICY "Allow anonymous contact form submissions"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  source = 'website_contact_form'
  AND status = 'new'
  AND lead_type = 'individual'
);