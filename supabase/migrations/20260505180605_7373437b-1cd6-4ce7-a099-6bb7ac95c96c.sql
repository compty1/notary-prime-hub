-- Appointment status change history with timestamps + notes
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  source text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appt_status_history_appt
  ON public.appointment_status_history(appointment_id, created_at DESC);

ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read appointment_status_history"
  ON public.appointment_status_history;
CREATE POLICY "Admins read appointment_status_history"
  ON public.appointment_status_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Notaries read assigned appointment_status_history"
  ON public.appointment_status_history;
CREATE POLICY "Notaries read assigned appointment_status_history"
  ON public.appointment_status_history FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'notary')
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_status_history.appointment_id
        AND a.notary_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients read own appointment_status_history"
  ON public.appointment_status_history;
CREATE POLICY "Clients read own appointment_status_history"
  ON public.appointment_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_status_history.appointment_id
        AND a.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated insert appointment_status_history"
  ON public.appointment_status_history;
CREATE POLICY "Authenticated insert appointment_status_history"
  ON public.appointment_status_history FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid() OR changed_by IS NULL);

-- Auto-record every appointment status change
CREATE OR REPLACE FUNCTION public.record_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_status_history
      (appointment_id, from_status, to_status, changed_by, source)
    VALUES (NEW.id, NULL, NEW.status::text, auth.uid(), 'create');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_status_history
      (appointment_id, from_status, to_status, changed_by, source)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid(), 'update');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_status_history ON public.appointments;
CREATE TRIGGER trg_appointment_status_history
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.record_appointment_status_change();