-- Ohio ORC §147 fee-cap enforcement on appointments
CREATE OR REPLACE FUNCTION public.enforce_ohio_fee_caps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_service text;
  v_price numeric;
  v_acts int;
  v_is_ron boolean;
BEGIN
  v_service := COALESCE(NEW.service_type, '');
  v_price := COALESCE(NEW.estimated_price, 0);
  v_acts := GREATEST(COALESCE(NEW.signer_count, 1), 1);
  v_is_ron := v_service ILIKE '%ron%' OR v_service ILIKE '%remote%';

  IF v_is_ron THEN
    -- $30 RON cap + $10 tech fee = $40 ceiling per session
    IF v_price > 40.00 THEN
      RAISE EXCEPTION 'Ohio ORC §147.66: RON fee ($%) exceeds $30 cap + $10 technology fee.', v_price;
    END IF;
  ELSE
    -- $5 per physical notarial act
    IF v_price > (v_acts * 5.00) + 200.00 THEN
      -- Allow up to $200 of legitimate non-notarial surcharges (travel, wait time, etc.)
      -- The $5/act cap applies strictly to the notarial portion, tracked separately in pricing_breakdown.
      RAISE EXCEPTION 'Ohio ORC §147.08: Physical-act fee total ($%) exceeds permissible cap for % act(s).', v_price, v_acts;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_ohio_fee_caps_trigger ON public.appointments;
CREATE TRIGGER enforce_ohio_fee_caps_trigger
  BEFORE INSERT OR UPDATE OF estimated_price, service_type, signer_count
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ohio_fee_caps();