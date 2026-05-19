-- Schedule cleanup-stale-reservations edge function every 5 minutes via pg_cron + pg_net
DO $$
DECLARE
  v_url text := 'https://svrebvbcsxaoluafblnq.supabase.co/functions/v1/cleanup-stale-reservations';
  v_anon text;
BEGIN
  -- Use anon key from platform_settings if present, else fall back to project anon key
  SELECT setting_value INTO v_anon FROM public.platform_settings WHERE setting_key = 'supabase_anon_key';
  IF v_anon IS NULL THEN
    v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2cmVidmJjc3hhb2x1YWZibG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODYxNTMsImV4cCI6MjA5MDQ2MjE1M30.6ffLdwfDxecaEnYISWL8yRW1oHGuYDRHj7NfHtvsjB4';
  END IF;

  -- Unschedule prior job if exists
  PERFORM cron.unschedule('cleanup-stale-reservations-5m')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-reservations-5m');

  PERFORM cron.schedule(
    'cleanup-stale-reservations-5m',
    '*/5 * * * *',
    format($f$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
        body := '{}'::jsonb
      ) as request_id;
    $f$, v_url, v_anon)
  );
END $$;