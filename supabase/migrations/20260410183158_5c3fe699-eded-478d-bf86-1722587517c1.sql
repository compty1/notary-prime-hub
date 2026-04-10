
-- Clean up duplicate triggers (keep trg_ prefixed versions)

-- Appointments duplicates
DROP TRIGGER IF EXISTS check_appointment_date ON public.appointments;
DROP TRIGGER IF EXISTS check_double_booking ON public.appointments;
DROP TRIGGER IF EXISTS generate_confirmation ON public.appointments;
DROP TRIGGER IF EXISTS generate_confirmation_number_trigger ON public.appointments;
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.appointments;
DROP TRIGGER IF EXISTS set_confirmation_number ON public.appointments;
DROP TRIGGER IF EXISTS set_updated_at_appointments ON public.appointments;
DROP TRIGGER IF EXISTS trg_crm_appointment_status ON public.appointments;
DROP TRIGGER IF EXISTS trg_prevent_duplicate_booking ON public.appointments;
DROP TRIGGER IF EXISTS trg_update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS trg_update_updated_at_appointments ON public.appointments;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS validate_appointment_date_trigger ON public.appointments;

-- Notarization sessions duplicates
DROP TRIGGER IF EXISTS enforce_kba_limit_trigger ON public.notarization_sessions;
DROP TRIGGER IF EXISTS generate_session_id ON public.notarization_sessions;
DROP TRIGGER IF EXISTS generate_session_unique_id_trigger ON public.notarization_sessions;
DROP TRIGGER IF EXISTS set_session_unique_id ON public.notarization_sessions;
DROP TRIGGER IF EXISTS set_updated_at_notarization_sessions ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_notarization_sessions_updated_at ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_set_retention_expires ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_update_sessions_updated_at ON public.notarization_sessions;

-- Documents duplicates
DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;
DROP TRIGGER IF EXISTS trg_update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS trg_update_updated_at_documents ON public.documents;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;

-- Leads duplicates
DROP TRIGGER IF EXISTS set_updated_at_leads ON public.leads;
DROP TRIGGER IF EXISTS trg_validate_email_leads ON public.leads;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS validate_lead_email ON public.leads;
DROP TRIGGER IF EXISTS validate_leads_email ON public.leads;

-- Other table duplicates
DROP TRIGGER IF EXISTS set_updated_at_apostille ON public.apostille_requests;
DROP TRIGGER IF EXISTS set_updated_at_apostille_requests ON public.apostille_requests;
DROP TRIGGER IF EXISTS update_apostille_requests_updated_at ON public.apostille_requests;
DROP TRIGGER IF EXISTS update_booking_drafts_updated_at ON public.booking_drafts;
DROP TRIGGER IF EXISTS set_updated_at_business_profiles ON public.business_profiles;
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
DROP TRIGGER IF EXISTS set_updated_at_client_correspondence ON public.client_correspondence;
DROP TRIGGER IF EXISTS set_updated_at_correspondence ON public.client_correspondence;
DROP TRIGGER IF EXISTS update_client_correspondence_updated_at ON public.client_correspondence;
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
DROP TRIGGER IF EXISTS set_email_drafts_updated_at ON public.email_drafts;
DROP TRIGGER IF EXISTS update_email_send_state_updated_at ON public.email_send_state;
DROP TRIGGER IF EXISTS trg_update_journal_entries_updated_at ON public.journal_entries;
DROP TRIGGER IF EXISTS set_updated_at_leads ON public.leads;
DROP TRIGGER IF EXISTS set_updated_at_client_style_profiles ON public.client_style_profiles;
DROP TRIGGER IF EXISTS set_updated_at_compliance_rule_sets ON public.compliance_rule_sets;
DROP TRIGGER IF EXISTS set_updated_at_document_collections ON public.document_collections;
