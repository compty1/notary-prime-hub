
-- DB-004: Merge platform_fees into platform_fee on notary_journal
UPDATE public.notary_journal
SET platform_fee = COALESCE(platform_fee, platform_fees)
WHERE platform_fee IS NULL AND platform_fees IS NOT NULL;

ALTER TABLE public.notary_journal DROP COLUMN IF EXISTS platform_fees;

-- DB-003: Drop unused business_roles table
DROP TABLE IF EXISTS public.business_roles;

-- DB-002: Create unified feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  service_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  feedback_type TEXT NOT NULL DEFAULT 'appointment_review' CHECK (feedback_type IN ('appointment_review', 'service_review', 'nps_survey')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public feedback" ON public.feedback
  FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can view all feedback" ON public.feedback
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.feedback
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" ON public.feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" ON public.feedback
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Migrate from client_feedback
INSERT INTO public.feedback (user_id, appointment_id, rating, comment, nps_score, feedback_type, created_at)
SELECT client_id, appointment_id, rating, comment, nps_score, 'appointment_review', created_at
FROM public.client_feedback
ON CONFLICT DO NOTHING;

-- Migrate from service_reviews
INSERT INTO public.feedback (user_id, service_id, rating, comment, feedback_type, created_at)
SELECT user_id, service_id, rating, comment, 'service_review', created_at
FROM public.service_reviews
ON CONFLICT DO NOTHING;

-- Migrate from reviews
INSERT INTO public.feedback (user_id, appointment_id, rating, comment, feedback_type, created_at)
SELECT client_id, appointment_id, rating, comment, 'appointment_review', created_at
FROM public.reviews r
WHERE NOT EXISTS (
  SELECT 1 FROM public.feedback f
  WHERE f.user_id = r.client_id
    AND f.appointment_id = r.appointment_id
    AND f.feedback_type = 'appointment_review'
)
ON CONFLICT DO NOTHING;

-- Create unified public view
CREATE OR REPLACE VIEW public.public_feedback AS
SELECT f.id, f.rating, f.comment, f.feedback_type, f.created_at,
       p.full_name AS reviewer_name, f.service_id, f.appointment_id
FROM public.feedback f
LEFT JOIN public.profiles p ON p.user_id = f.user_id
WHERE f.is_public = true;

-- DB-001: Backward-compatible view using correct notary_journal columns
CREATE OR REPLACE VIEW public.journal_entries_legacy AS
SELECT id, created_by AS notary_user_id, signer_name AS notary_name,
       created_at::date::text AS entry_date,
       to_char(created_at, 'HH24:MI') AS entry_time,
       document_type, service_performed AS notarial_act_type,
       journal_number::text AS journal_number, signer_name, signer_address,
       id_type, id_number,
       CASE WHEN notarization_type = 'ron' THEN 'audio-video' ELSE 'in-person' END AS communication_technology,
       notes, appointment_id, created_at
FROM public.notary_journal;

-- Indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_appointment_id ON public.feedback(appointment_id);
CREATE INDEX idx_feedback_service_id ON public.feedback(service_id);
CREATE INDEX idx_feedback_type ON public.feedback(feedback_type);
