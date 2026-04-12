-- REM-033: Performance indexes for frequently queried columns
-- Only create if not exists to be safe

CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_notary_id ON public.appointments (notary_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_payments_client_status ON public.payments (client_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_notary ON public.journal_entries (notary_user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries (entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_appt ON public.notarization_sessions (appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_appointment ON public.documents (appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON public.service_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals (stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON public.crm_activities (contact_id);
