
CREATE INDEX IF NOT EXISTS idx_booking_drafts_user_id ON public.booking_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_created_by ON public.business_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_client_style_profiles_user_id ON public.client_style_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_document_collections_user_id ON public.document_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_document_bundles_bundle_type ON public.document_bundles(bundle_type);
CREATE INDEX IF NOT EXISTS idx_email_signatures_user_id ON public.email_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_form_library_uploaded_by ON public.form_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_lead_sources_source_type ON public.lead_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_notary_certifications_user_id ON public.notary_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notary_invites_email ON public.notary_invites(email);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON public.service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requirements_service_id ON public.service_requirements(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON public.service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_time_slots_day_available ON public.time_slots(day_of_week, is_available);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON public.waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_service_workflows_service_id ON public.service_workflows(service_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_sets_category ON public.compliance_rule_sets(category);
CREATE INDEX IF NOT EXISTS idx_build_tracker_plans_source ON public.build_tracker_plans(source);

ALTER TABLE public.e_seal_verifications ADD COLUMN IF NOT EXISTS document_hash text;

ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS credential_analysis_result jsonb;
