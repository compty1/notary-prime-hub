
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
  ('print_local_pickup_enabled', 'true'),
  ('print_standard_shipping_rate', '5.99'),
  ('print_express_shipping_rate', '14.99'),
  ('print_overnight_shipping_rate', '29.99'),
  ('print_rush_surcharge_multiplier', '1.50'),
  ('print_3day_rush_multiplier', '1.25'),
  ('print_default_turnaround_days', '5'),
  ('print_quality_check_required', 'true'),
  ('print_auto_vendor_routing', 'true'),
  ('print_packaging_branded', 'true'),
  ('print_order_prefix', 'PO'),
  ('print_proof_approval_required', 'true'),
  ('print_reprint_policy_days', '30'),
  ('print_min_resolution_dpi', '300'),
  ('print_bleed_inches', '0.125'),
  ('print_free_shipping_threshold', '150.00')
ON CONFLICT (setting_key) DO NOTHING;
