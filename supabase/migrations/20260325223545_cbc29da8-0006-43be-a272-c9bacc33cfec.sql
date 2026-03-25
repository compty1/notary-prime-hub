
-- Enable realtime for notarization_sessions only (others already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notarization_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notarization_sessions;
  END IF;
END $$;

-- Add profiles DELETE policy for account closure
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add unique constraint to prevent double-booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking ON public.appointments(client_id, scheduled_date, scheduled_time) WHERE status NOT IN ('cancelled', 'no_show');
