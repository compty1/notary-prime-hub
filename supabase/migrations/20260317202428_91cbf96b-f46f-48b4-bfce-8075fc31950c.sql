CREATE POLICY "Allow anonymous provider applications" ON public.leads
FOR INSERT TO anon
WITH CHECK (source = 'provider_application' AND status = 'new' AND lead_type = 'notary');