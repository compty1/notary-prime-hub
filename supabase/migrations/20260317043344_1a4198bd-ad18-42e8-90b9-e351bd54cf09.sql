DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notary_journal_updated_at ON public.notary_journal;
CREATE TRIGGER update_notary_journal_updated_at BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notarization_sessions_updated_at ON public.notarization_sessions;
CREATE TRIGGER update_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_apostille_requests_updated_at ON public.apostille_requests;
CREATE TRIGGER update_apostille_requests_updated_at BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_correspondence_updated_at ON public.client_correspondence;
CREATE TRIGGER update_client_correspondence_updated_at BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();