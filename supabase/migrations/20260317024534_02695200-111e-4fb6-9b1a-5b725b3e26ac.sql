
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'notarization',
  description text,
  short_description text,
  price_from numeric DEFAULT 0,
  price_to numeric DEFAULT 0,
  pricing_model text NOT NULL DEFAULT 'flat',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  icon text DEFAULT 'FileText',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);

INSERT INTO public.services (name, category, short_description, description, price_from, price_to, pricing_model, display_order, icon) VALUES
('Remote Online Notarization (RON)', 'notarization', 'Secure video notarization via BlueNotary', 'Legally compliant online notarization via secure video session. Recorded audit trail and instant digital delivery. Ohio authorized under ORC §147.65-.66.', 25, 35, 'per_seal', 1, 'Monitor'),
('In-Person Notarization', 'notarization', 'Office or mobile visits', 'Office or mobile notary visits for documents requiring physical presence. Evening and weekend appointments available.', 10, 25, 'per_seal', 2, 'MapPin'),
('Witness Services', 'notarization', 'Virtual or in-person witnesses', 'Provide one or more witnesses for signings, virtual or in-person.', 10, 25, 'per_document', 3, 'Users'),
('Certified Copy Facilitation', 'notarization', 'Prepare and deliver certified copy requests', 'Prepare requests and deliver to issuing agencies for certified copies where allowed.', 15, 50, 'per_document', 4, 'Copy'),
('ID Verification / KYC Checks', 'verification', 'Non-notarial identity checks', 'Non-notarial identity checks including liveness scans and facial match verification.', 5, 20, 'per_document', 10, 'ScanFace'),
('I-9 Employment Verification', 'verification', 'Authorized representative I-9 completion', 'Complete Form I-9 on behalf of employers as an authorized representative. Remote or in-person options with bulk pricing.', 35, 50, 'flat', 11, 'ClipboardCheck'),
('Employment Onboarding Support', 'verification', 'Document collection and verification', 'Document collection, verification checklist, and secure delivery to employer for new hires.', 25, 75, 'flat', 12, 'Briefcase'),
('Background Check Coordination', 'verification', 'Third-party background check coordination', 'Coordinate third-party background checks and deliver results to clients via partnered providers.', 10, 30, 'flat', 13, 'Search'),
('Clerical Document Preparation', 'document_services', 'Non-legal form filling and formatting', 'Fill non-legal fields, format, paginate, add initials, and prepare signing packets.', 15, 40, 'per_document', 20, 'FileEdit'),
('PDF Services', 'document_services', 'Conversion, OCR, redaction, merge/split', 'PDF conversion, OCR text recognition, redaction, compression, merge/split, and flattening.', 3, 15, 'per_document', 21, 'FileType'),
('Document Scanning & Digitization', 'document_services', 'Mobile or in-office scanning', 'Mobile or in-office scanning, indexing, and creation of searchable PDFs.', 0.25, 1, 'per_document', 22, 'Scan'),
('Document Cleanup & Formatting', 'document_services', 'Reformat and standardize documents', 'Reformat Word/PDF documents, remove metadata, standardize fonts and margins.', 20, 75, 'per_document', 23, 'Paintbrush'),
('Form Filling Assistance', 'document_services', 'Guided clerical completion of forms', 'Guided, clerical completion of government and business forms with step-by-step wizard.', 10, 50, 'per_document', 24, 'FormInput'),
('Certified Document Prep for Agencies', 'document_services', 'Packets for courts and agencies', 'Prepare packets for courts, Secretary of State, consulates, and other agencies.', 25, 100, 'per_document', 25, 'Building'),
('Apostille Facilitation', 'authentication', 'Submit and track apostille requests', 'Prepare, submit, and track apostille requests with the Ohio Secretary of State. Includes courier and return shipping.', 75, 150, 'flat', 30, 'Globe'),
('Consular Legalization Prep', 'authentication', 'Package documents for consulate submission', 'Package documents for consulate submission with guidance on requirements for international use.', 75, 200, 'flat', 31, 'Flag'),
('Notarized Translation Coordination', 'authentication', 'Certified translation + notarization', 'Coordinate certified translations with professional translators and notarize translated documents.', 25, 100, 'flat', 32, 'Languages'),
('Bulk Notarization Packages', 'business', 'Tiered pricing for volume clients', 'Custom tiered pricing for high-volume clients such as title companies, law firms, and HR departments.', 0.50, 5, 'per_seal', 40, 'Layers'),
('Business Subscription Plans', 'business', 'Monthly plans with included notarizations', 'Monthly plans with included notarizations, priority booking, team seats, and dedicated support.', 99, 399, 'monthly', 41, 'CreditCard'),
('API & Integration Services', 'business', 'Webhook and API intake automation', 'Webhook, SFTP, or API intake for corporate clients to push documents and pull status.', 50, 300, 'monthly', 42, 'Code'),
('White-Label Partner Programs', 'business', 'Branded notary services for partners', 'Offer branded notary services for law firms, HR vendors, and referral network partners.', 0, 0, 'custom', 43, 'Award'),
('Registered Agent Coordination', 'business', 'Registered agent document preparation', 'Assist clients in preparing and submitting registered agent documents for business filings.', 25, 100, 'flat', 44, 'Building2'),
('Secure Document Vault & Storage', 'recurring', 'Encrypted cloud storage for documents', 'Encrypted long-term cloud storage, retrieval, and audit logs for your notarized documents.', 5, 25, 'monthly', 50, 'Lock'),
('Virtual Mailroom', 'recurring', 'Scan, tag, and upload incoming mail', 'Receive, scan, tag, and upload physical mail to your portal with optional shredding or forwarding.', 25, 75, 'monthly', 51, 'Inbox'),
('Automated Reminders & Renewals', 'recurring', 'Expiration and renewal notifications', 'Automated notifications for expiring documents, license renewals, and recurring filing deadlines.', 5, 20, 'monthly', 52, 'Bell'),
('Template Library & Form Builder', 'recurring', 'Pre-built templates and guided wizard', 'Access pre-built templates for travel consent, affidavits, bills of sale with a guided wizard.', 5, 25, 'per_document', 53, 'Layout'),
('Document Retention & Compliance', 'recurring', 'Long-term archival and compliance reporting', 'Long-term document archival, audit logs, and compliance reporting packages for businesses.', 50, 300, 'monthly', 54, 'Shield'),
('RON Onboarding Consulting', 'consulting', 'Train staff on BlueNotary workflows', 'Train staff on BlueNotary workflows, best practices, and Ohio compliance requirements.', 150, 500, 'flat', 60, 'GraduationCap'),
('Document Workflow Audits', 'consulting', 'Analyze and optimize document processes', 'Analyze and optimize document processes for efficiency, security, and RON readiness.', 250, 1500, 'flat', 61, 'ClipboardList'),
('Custom Workflow Design', 'consulting', 'Design intake-to-storage automation', 'Design custom intake to notarization to storage flows and implement automations.', 500, 5000, 'flat', 62, 'Workflow'),
('Closing Coordination (Real Estate)', 'consulting', 'Coordinate signings for closings', 'Coordinate signings, witnesses, and document delivery for real estate closings.', 75, 250, 'flat', 63, 'Home'),
('Immigration Document Packaging', 'consulting', 'Organize immigration packets', 'Organize and prepare immigration document packets for clients and attorneys.', 50, 200, 'flat', 64, 'Plane');
