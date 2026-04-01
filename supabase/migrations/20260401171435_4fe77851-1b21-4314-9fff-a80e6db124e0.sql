
-- Build Tracker Items table
CREATE TABLE public.build_tracker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'gap',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  impact_area text,
  suggested_fix text,
  is_on_todo boolean NOT NULL DEFAULT false,
  todo_priority integer,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_tracker_items ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
CREATE POLICY "Admins manage build tracker"
  ON public.build_tracker_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.build_tracker_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: comprehensive gap analysis items
INSERT INTO public.build_tracker_items (title, description, category, severity, status, impact_area, suggested_fix) VALUES
-- Phase 1: CRM (resolved)
('Native CRM Dashboard', 'Full CRM hub with Pipeline, Contacts, Deals, Activities, Reports tabs', 'feature', 'high', 'resolved', 'CRM', 'Implemented at /admin/crm'),
('CRM Deals Table', 'Deals table with stage tracking, value, HubSpot sync fields', 'feature', 'high', 'resolved', 'CRM', 'Database table created with RLS'),
('CRM Activities Table', 'Activity logging for notes, calls, emails, meetings', 'feature', 'medium', 'resolved', 'CRM', 'crm_activities table with RLS'),
('CRM Auto-Activity on Events', 'Auto-create CRM activity on appointment/email/payment events', 'workflow', 'medium', 'open', 'CRM', 'Add triggers or edge function hooks to create crm_activities rows on appointment status change, payment completion, and email send events'),
('HubSpot Deal Bidirectional Sync', 'Sync deals between CRM and HubSpot in both directions', 'feature', 'low', 'open', 'CRM', 'Extend hubspot-sync edge function to push deal stage changes back to HubSpot and poll for HubSpot deal updates'),

-- Phase 2: RON Guide (resolved)
('Notary Session Guide Panel', 'Dynamic checklist panel in RON session with Ohio-specific steps', 'feature', 'high', 'resolved', 'RON Session', 'NotarySessionGuide component implemented'),
('Ohio Document Eligibility Logic', 'Block prohibited documents, detect witness requirements', 'compliance', 'critical', 'resolved', 'RON Session', 'ohioDocumentEligibility.ts implemented'),
('Session Guide Progress Tracking', 'Collapsible side panel with step completion tracking', 'ux', 'medium', 'resolved', 'RON Session', 'Implemented in RonSession.tsx'),

-- Phase 3: Booking (resolved)
('Booking Route Aliases', '/booking and /schedule routes as aliases to /book', 'ux', 'low', 'resolved', 'Booking Flow', 'Routes added in App.tsx'),
('Booking Draft Auto-Save', 'Auto-save booking drafts to database for logged-in users', 'feature', 'high', 'resolved', 'Booking Flow', 'booking_drafts table with debounced save'),
('Google Calendar Integration', 'Sync appointments with Google Calendar', 'feature', 'medium', 'deferred', 'Booking Flow', 'Requires GOOGLE_CALENDAR API secrets - implement OAuth flow and calendar sync edge function'),

-- Phase 4: Security (resolved)
('E-Sign Consent Step', 'UETA/ESIGN Act disclosure with mandatory checkbox before RON', 'compliance', 'critical', 'resolved', 'Security', 'ESignConsent component blocks session until consented'),
('Click-Wrap Terms Agreement', 'Mandatory ToS checkbox on booking review step', 'compliance', 'high', 'resolved', 'Booking Flow', 'Implemented in BookingReviewStep'),
('IDOR Prevention', 'Signed URL architecture for document access', 'security', 'critical', 'resolved', 'Security', 'Covered by signed URL architecture'),
('Session Security', 'Secure session management', 'security', 'high', 'resolved', 'Security', 'Handled by Supabase Auth'),

-- Phase 5: Ohio Compliance (resolved)
('Document Eligibility Blocking', 'Block prohibited vital records and court orders', 'compliance', 'critical', 'resolved', 'Compliance', 'checkDocumentEligibility function implemented'),
('Witness Threshold Detection', 'Wills require 2 witnesses per ORC §2107.03', 'compliance', 'critical', 'resolved', 'Compliance', 'Automatic detection in eligibility logic'),
('Oath Type Determination', 'Auto-determine acknowledgment vs jurat vs oath', 'compliance', 'high', 'resolved', 'Compliance', 'Implemented in ohioDocumentEligibility.ts'),
('Jurisdictional Validation', 'Service area geographic check', 'compliance', 'medium', 'resolved', 'Compliance', 'geoUtils.ts service area check'),

-- Phase 6: Accessibility (resolved)
('Focus Management', 'Global focus-visible ring with design tokens', 'ux', 'high', 'resolved', 'Accessibility', 'CSS implemented in index.css'),
('Touch Targets 44px', 'Minimum 44px touch targets on mobile', 'ux', 'medium', 'resolved', 'Accessibility', 'pointer:coarse media query in index.css'),
('Reduced Motion Support', 'prefers-reduced-motion disables animations', 'ux', 'medium', 'resolved', 'Accessibility', 'Media query in index.css'),
('High Contrast Mode', 'forced-colors media query support', 'ux', 'low', 'resolved', 'Accessibility', 'CSS in index.css'),
('Skip to Main Content', 'Keyboard navigation skip link', 'ux', 'medium', 'resolved', 'Accessibility', 'Skip link in AdminDashboard'),

-- Phase 7: SEO (resolved)
('JSON-LD Structured Data', 'Schema.org markup for search engines', 'seo', 'medium', 'resolved', 'SEO', 'Implemented across pages'),
('OG/Twitter Meta Tags', 'Social sharing metadata', 'seo', 'medium', 'resolved', 'SEO', 'usePageMeta hook available'),
('Canonical URLs', 'Prevent duplicate content indexing', 'seo', 'medium', 'resolved', 'SEO', 'Implemented'),
('Dynamic Copyright Year', 'Auto-updating year in footer', 'seo', 'low', 'resolved', 'SEO', 'Footer component updated'),

-- Phase 8: Email Templates (resolved)
('Email Template Designer', 'Visual editor with logo, colors, fonts, live preview', 'feature', 'high', 'resolved', 'Email', 'EmailTemplateDesigner component in AdminSettings'),

-- Phase 9: SignNow Webhooks (resolved)
('Webhook Status Tracking', 'Track webhook registration status per session', 'feature', 'medium', 'resolved', 'RON Session', 'webhook_status and webhook_events_registered columns'),
('Document Webhook Query', 'Query SignNow API for active subscriptions', 'feature', 'medium', 'resolved', 'RON Session', 'check_document_webhooks action in edge function'),

-- Phase 10-12: UX & Hardware (resolved)
('Special Instructions Field', 'Gate codes, accessibility needs in booking', 'ux', 'medium', 'resolved', 'Booking Flow', 'Added to BookingIntakeFields'),
('Browser Version Gate', 'Minimum Chrome/Firefox/Edge 90, Safari 15', 'security', 'high', 'resolved', 'RON Session', 'TechCheck component updated'),
('WebRTC NAT Traversal Test', 'STUN server connectivity test', 'feature', 'high', 'resolved', 'RON Session', 'TechCheck enhanced'),
('Age Verification', 'DOB field with minor detection for guardian co-signer', 'compliance', 'high', 'resolved', 'Booking Flow', 'BookingIntakeFields updated'),
('Multi-Signer Config', 'Additional signer email field', 'feature', 'medium', 'resolved', 'Booking Flow', 'additionalSignerEmails field added'),

-- Open gaps and missing functionality
('Rate Limiting on Public Forms', 'Prevent spam submissions on contact/lead forms', 'security', 'high', 'open', 'Security', 'Add rate limiting middleware to submit-lead and public form edge functions using IP-based throttling'),
('CSRF Protection', 'Cross-site request forgery protection on mutations', 'security', 'high', 'open', 'Security', 'Implement CSRF token validation on state-changing operations via custom headers'),
('Input Sanitization Audit', 'Verify all user inputs are sanitized against XSS', 'security', 'critical', 'open', 'Security', 'Audit all form inputs for XSS vectors, add DOMPurify or similar sanitization library'),
('Password Strength Enforcement', 'Enforce minimum password complexity on signup', 'security', 'high', 'open', 'Security', 'Add zod validation for password strength (min 8 chars, mixed case, number, special char) on SignUp page'),
('Session Timeout Warning', 'Warn user before RON session auto-expires', 'ux', 'medium', 'open', 'RON Session', 'Add countdown timer component that warns at 5min and 1min before session_timeout_minutes expires'),
('Document Version History', 'Track document revisions and allow rollback', 'feature', 'medium', 'open', 'Documents', 'Add document_versions table with version number, file_path, created_at; modify upload flow to create versions'),
('Bulk Document Upload', 'Upload multiple documents at once', 'feature', 'medium', 'open', 'Documents', 'Add multi-file dropzone to document upload, process each file sequentially with progress indicator'),
('Document OCR Enhancement', 'Improve OCR accuracy and add batch processing', 'feature', 'low', 'open', 'Documents', 'Enhance ocr-digitize edge function with pre-processing and batch support'),
('Payment Receipt Generation', 'Auto-generate PDF receipts after payment', 'feature', 'high', 'open', 'Payments', 'Create generate-receipt edge function that produces PDF receipt and stores in documents bucket'),
('Refund Workflow', 'Admin interface for processing refunds', 'feature', 'high', 'open', 'Payments', 'Add refund button in AdminRevenue with Stripe refund API integration'),
('Recurring Appointment Support', 'Allow scheduling recurring appointments', 'feature', 'medium', 'open', 'Booking Flow', 'Add recurrence_rule field to appointments, create recurring appointment generator'),
('Appointment Rescheduling Flow', 'Client self-service rescheduling with constraints', 'feature', 'high', 'open', 'Booking Flow', 'Add reschedule button in client portal that creates new appointment linked via rescheduled_from'),
('Client Document Expiry Alerts', 'Notify clients when uploaded documents near expiry', 'feature', 'medium', 'open', 'Documents', 'Create scheduled function to check document_reminders and send notification emails'),
('Admin Dashboard Analytics', 'Revenue trends, appointment volume, client growth charts', 'feature', 'high', 'open', 'Admin', 'Add recharts time-series graphs to AdminOverview with date range filtering'),
('Notary Assignment Algorithm', 'Auto-assign notaries based on availability and location', 'workflow', 'high', 'open', 'Booking Flow', 'Create assignment logic considering notary availability, distance to client, workload balance'),
('Client Feedback System', 'Post-appointment satisfaction survey', 'feature', 'medium', 'open', 'UX', 'Create feedback form triggered after appointment completion, store in feedback table'),
('Multi-Language Support', 'Spanish language interface option', 'feature', 'medium', 'open', 'UX', 'Implement i18n framework with Spanish translations for all user-facing text'),
('Offline Mode for Mobile', 'Cache critical data for offline access', 'feature', 'low', 'open', 'Performance', 'Add service worker with IndexedDB caching for appointments and documents'),
('API Rate Monitoring Dashboard', 'Track API usage and rate limits', 'feature', 'low', 'open', 'Admin', 'Create monitoring page showing edge function invocation counts and error rates'),
('Automated Backup Verification', 'Verify database backups are complete and restorable', 'security', 'medium', 'open', 'Security', 'Create health check endpoint that verifies backup integrity'),
('Two-Factor Authentication', 'Optional 2FA for admin and notary accounts', 'security', 'high', 'open', 'Security', 'Enable Supabase MFA for admin/notary roles, add TOTP setup flow in account settings'),
('Commission Renewal Reminders', 'Alert notaries before commission expiration', 'compliance', 'high', 'open', 'Compliance', 'Create scheduled function checking commission_expiration in profiles, send email 90/60/30 days before'),
('Notary Continuing Education Tracking', 'Track CE credits and requirements', 'compliance', 'medium', 'open', 'Compliance', 'Add continuing_education table with credit tracking and deadline reminders'),
('Audit Log Export', 'Export audit trail to CSV/PDF for compliance', 'compliance', 'medium', 'open', 'Compliance', 'Add export button to AdminAuditLog that generates CSV with date range filtering'),
('Recording Storage Compliance', 'Ensure RON recordings meet 10-year retention per Ohio law', 'compliance', 'critical', 'open', 'Compliance', 'Implement retention policy on recordings bucket, add lifecycle rules, create archival workflow'),
('Client Portal Dashboard Redesign', 'Improve client portal with status cards and quick actions', 'ux', 'medium', 'open', 'UX', 'Redesign ClientPortal with appointment status cards, document upload shortcut, and next-steps guidance'),
('Mobile Responsive Admin', 'Optimize admin panel for mobile/tablet use', 'ux', 'medium', 'open', 'Admin', 'Add responsive breakpoints to admin tables and forms, test on 375px-768px viewports'),
('Loading State Improvements', 'Add skeleton loaders to all data-fetching pages', 'ux', 'low', 'open', 'UX', 'Create reusable skeleton components, add to all pages that use useQuery'),
('Error Recovery UX', 'Graceful error handling with retry options on all pages', 'ux', 'medium', 'open', 'UX', 'Add ErrorBoundary with retry button to all route-level components, improve error messages'),
('Keyboard Navigation Audit', 'Ensure all interactive elements are keyboard accessible', 'ux', 'high', 'open', 'Accessibility', 'Audit all custom components for keyboard trap issues, add proper tabIndex and key handlers'),
('Screen Reader Audit', 'Full NVDA/VoiceOver testing pass', 'ux', 'high', 'open', 'Accessibility', 'Test all pages with screen reader, add missing aria-labels, fix heading hierarchy'),
('Color Contrast Audit', 'Verify all text meets WCAG AA 4.5:1 contrast ratio', 'ux', 'medium', 'open', 'Accessibility', 'Run axe-core audit, fix any failing contrast ratios in design tokens'),
('Sitemap Auto-Generation', 'Dynamic sitemap from routes', 'seo', 'medium', 'open', 'SEO', 'Create build script that generates sitemap.xml from App.tsx routes with proper priorities and changefreq'),
('Page Speed Optimization', 'Reduce bundle size and improve LCP', 'performance', 'high', 'open', 'Performance', 'Analyze bundle with vite-bundle-visualizer, code-split large components, optimize images'),
('Database Query Optimization', 'Add indexes for slow queries', 'performance', 'medium', 'open', 'Performance', 'Run EXPLAIN ANALYZE on frequently used queries, add composite indexes where beneficial'),
('Edge Function Cold Start', 'Reduce cold start times on edge functions', 'performance', 'medium', 'open', 'Performance', 'Minimize edge function dependencies, use dynamic imports, consider warm-up pings'),
('Email Deliverability Monitoring', 'Track bounce rates and deliverability', 'feature', 'medium', 'open', 'Email', 'Add bounce tracking to email_send_log, create deliverability dashboard in admin'),
('Email Template Versioning', 'Version control for email templates', 'feature', 'low', 'open', 'Email', 'Store template versions in platform_settings with version number and rollback capability'),
('Stripe Subscription Management', 'Monthly subscription billing for business clients', 'feature', 'high', 'open', 'Payments', 'Implement Stripe subscription API, add plan management UI in SubscriptionPlans page'),
('Invoice PDF Generation', 'Professional invoice creation and download', 'feature', 'high', 'open', 'Payments', 'Create PDF generation in InvoiceGenerator using existing component, add download/email functionality'),
('Notary Availability Calendar UI', 'Visual calendar for setting availability windows', 'ux', 'medium', 'open', 'Booking Flow', 'Replace current availability form with drag-to-select calendar grid showing weekly time blocks');
