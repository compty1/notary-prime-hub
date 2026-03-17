
-- Phase 1: Allow business owners to manage their own team members
CREATE POLICY "Owners can add members"
ON public.business_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE id = business_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Owners can remove members"
ON public.business_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE id = business_id AND created_by = auth.uid()
  )
);

-- Allow business owners to SELECT their own team members
CREATE POLICY "Owners view members"
ON public.business_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE id = business_id AND created_by = auth.uid()
  )
);

-- Allow clients to delete own documents
CREATE POLICY "Clients can delete own documents"
ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = uploaded_by);

-- Allow clients to update/delete own reviews
CREATE POLICY "Clients can update own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = client_id);
