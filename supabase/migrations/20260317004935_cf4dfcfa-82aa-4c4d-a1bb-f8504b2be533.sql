
-- Enable pg_cron and pg_net for scheduled email sending
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Track which emails have been sent for each appointment
CREATE TABLE public.appointment_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  email_type text NOT NULL, -- 'confirmation', 'reminder_24hr', 'reminder_30min'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, email_type)
);

ALTER TABLE public.appointment_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage appointment emails" ON public.appointment_emails
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own appointment emails" ON public.appointment_emails
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM appointments WHERE appointments.id = appointment_emails.appointment_id AND appointments.client_id = auth.uid()
    )
  );
