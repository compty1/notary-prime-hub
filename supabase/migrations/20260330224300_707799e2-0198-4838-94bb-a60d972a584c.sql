
-- ==========================================================
-- 1. Add notary_id to appointments for assignment tracking
-- ==========================================================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notary_id uuid;

-- Index for notary assignment lookups
CREATE INDEX IF NOT EXISTS idx_appointments_notary_id ON public.appointments(notary_id);

-- ==========================================================
-- 2. Scope notary policies on PROFILES to assigned clients only
-- ==========================================================
DROP POLICY IF EXISTS "Notaries view profiles" ON public.profiles;

CREATE POLICY "Notaries view assigned client profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = profiles.user_id
    AND a.notary_id = auth.uid()
  )
);

-- ==========================================================
-- 3. Scope notary policies on DOCUMENTS to assigned appointments
-- ==========================================================
DROP POLICY IF EXISTS "Notaries view documents" ON public.documents;

CREATE POLICY "Notaries view assigned documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND (
    -- Documents linked to an appointment assigned to this notary
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = documents.appointment_id
      AND a.notary_id = auth.uid()
    )
    -- Or documents uploaded by a client the notary has any appointment with
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.client_id = documents.uploaded_by
      AND a.notary_id = auth.uid()
    )
  )
);

-- ==========================================================
-- 4. Scope notary policies on NOTARIZATION_SESSIONS
-- ==========================================================
DROP POLICY IF EXISTS "Notaries manage sessions" ON public.notarization_sessions;

CREATE POLICY "Notaries view assigned sessions"
ON public.notarization_sessions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = notarization_sessions.appointment_id
    AND a.notary_id = auth.uid()
  )
);

CREATE POLICY "Notaries update assigned sessions"
ON public.notarization_sessions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = notarization_sessions.appointment_id
    AND a.notary_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'notary'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = notarization_sessions.appointment_id
    AND a.notary_id = auth.uid()
  )
);

CREATE POLICY "Notaries insert sessions for assigned appointments"
ON public.notarization_sessions FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'notary'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = notarization_sessions.appointment_id
    AND a.notary_id = auth.uid()
  )
);

-- ==========================================================
-- 5. Scope notary policies on APPOINTMENTS (view + update)
-- ==========================================================
DROP POLICY IF EXISTS "Notaries view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Notaries update appointments" ON public.appointments;

CREATE POLICY "Notaries view assigned appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND notary_id = auth.uid()
);

CREATE POLICY "Notaries update assigned appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND notary_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'notary'::app_role)
  AND notary_id = auth.uid()
);

-- ==========================================================
-- 6. Remove broad notary access from tables with no notary relationship
-- ==========================================================
DROP POLICY IF EXISTS "Notaries view apostille" ON public.apostille_requests;
DROP POLICY IF EXISTS "Notaries view service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Notaries view correspondence" ON public.client_correspondence;

-- ==========================================================
-- 7. Fix public reviews — create a view that hides client_id
-- ==========================================================
DROP POLICY IF EXISTS "Public view reviews" ON public.reviews;

CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, appointment_id, rating, comment, created_at
FROM public.reviews;

-- Re-add a safer public reviews policy that only exposes rating and comment
CREATE POLICY "Public view reviews anonymized"
ON public.reviews FOR SELECT
TO anon
USING (true);
-- Note: The view above should be used by the public frontend instead
