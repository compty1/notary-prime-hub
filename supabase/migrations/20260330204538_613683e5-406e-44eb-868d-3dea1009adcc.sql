
INSERT INTO public.services (name, category, description, short_description, icon, pricing_model, price_from, price_to, display_order, is_active) VALUES
-- Notarization (1-6)
('Remote Online Notarization', 'notarization', 'Get documents notarized remotely via secure video call. Fully compliant with Ohio Revised Code §147.65-.66. Includes identity verification and KBA.', 'Secure video-call notarization from anywhere', 'Monitor', 'flat', 25, 50, 1, true),
('In-Person Notarization', 'notarization', 'Traditional face-to-face notarization at our office or a convenient location. Bring valid government-issued photo ID.', 'Face-to-face notarization services', 'MapPin', 'flat', 10, 25, 2, true),
('Mobile Notarization', 'notarization', 'We come to you — home, office, hospital, or any location within the Columbus metro area. Travel fee applies based on distance.', 'Notary comes to your location', 'MapPin', 'flat', 50, 100, 3, true),
('Certified Copy', 'notarization', 'Notarized certification that a copy of an original document is a true and accurate reproduction.', 'Notarized true-copy certification', 'Copy', 'flat', 10, 15, 4, true),
('Witness Services', 'notarization', 'Professional witness services for document signings, oath administration, and legal proceedings.', 'Professional witness for signings', 'Users', 'flat', 25, 50, 5, true),
('Oath / Affirmation', 'notarization', 'Administration of oaths and affirmations for affidavits, depositions, and sworn statements per Ohio law.', 'Sworn oath or affirmation services', 'Shield', 'flat', 10, 15, 6, true),
-- Verification (7-9)
('ID Verification / KYC Checks', 'verification', 'Identity verification and Know Your Customer checks using government-issued ID, facial recognition, and knowledge-based authentication.', 'Identity & KYC verification', 'ScanFace', 'flat', 15, 30, 7, true),
('I-9 Employment Verification', 'verification', 'Authorized agent services for completing Section 2 of Form I-9 for remote employees. Compliant with USCIS requirements.', 'I-9 employment eligibility verification', 'ClipboardCheck', 'flat', 25, 40, 8, true),
('Background Check Coordination', 'verification', 'Coordinate and facilitate background check documentation, notarization of consent forms, and verification letters.', 'Background check document coordination', 'Search', 'custom', 0, 0, 9, true),
-- Document Services (10-15)
('Clerical Document Preparation', 'document_services', 'Professional preparation of legal and business documents. We format, organize, and prepare your documents for signing.', 'Professional document preparation', 'FileEdit', 'flat', 25, 75, 10, true),
('Document Cleanup & Formatting', 'document_services', 'Clean up, reformat, and professionally style your existing documents. Includes spell-check, layout fixes, and print-ready formatting.', 'Document formatting and cleanup', 'Paintbrush', 'flat', 15, 50, 11, true),
('Form Filling Assistance', 'document_services', 'Guided assistance filling out complex legal, government, or business forms. We help ensure accuracy and completeness.', 'Help completing complex forms', 'FormInput', 'flat', 15, 40, 12, true),
('PDF Services', 'document_services', 'PDF conversion, merging, splitting, OCR text extraction, and digital formatting services.', 'PDF processing and conversion', 'FileType', 'flat', 10, 30, 13, true),
('Document Scanning & Digitization', 'document_services', 'AI-powered OCR scanning to convert paper documents into searchable, editable digital files.', 'Scan and digitize paper documents', 'Scan', 'flat', 5, 25, 14, true),
('Document Translation', 'document_services', 'AI-assisted document translation with professional review. Supports multiple languages.', 'AI-powered document translation', 'Languages', 'flat', 25, 100, 15, true),
-- Authentication (16-18)
('Apostille Facilitation', 'authentication', 'We handle the entire apostille process — preparing documents, submitting to the Ohio Secretary of State, and tracking status for Hague Convention countries.', 'Full apostille processing service', 'Flag', 'flat', 75, 150, 16, true),
('Consular Legalization Prep', 'authentication', 'Document preparation and coordination for consular legalization for non-Hague Convention countries.', 'Prep for consular legalization', 'Globe', 'custom', 0, 0, 17, true),
('Notarized Translation Coordination', 'authentication', 'Coordination of certified translations with notarized attestation for international use.', 'Certified translation coordination', 'Languages', 'flat', 50, 150, 18, true),
-- Business (19-21)
('Business Subscription Plans', 'business', 'Volume pricing and priority scheduling for businesses with recurring notarization needs. Includes dedicated account management.', 'Volume plans for businesses', 'Building', 'monthly', 99, 499, 19, true),
('API & Integration Services', 'business', 'RESTful API access for embedding notarization workflows into your existing business systems and applications.', 'API access for business systems', 'Code', 'monthly', 199, 999, 20, true),
('White-Label Partner Programs', 'business', 'Partner with Notar to offer notarization services under your brand. Includes revenue sharing and custom branding.', 'White-label notary partnership', 'Award', 'custom', 0, 0, 21, true),
-- Recurring (22-24)
('Document Storage Vault', 'recurring', 'Secure encrypted cloud storage for your important documents. Access anytime from your client portal with full version history.', 'Secure cloud document storage', 'Lock', 'monthly', 5, 15, 22, true),
('Virtual Mailroom', 'recurring', 'We receive, scan, and digitize your physical mail. View scanned documents in your portal and manage forwarding.', 'Digital mail receiving and scanning', 'Inbox', 'monthly', 29, 79, 23, true),
('Template Library & Form Builder', 'recurring', 'Access to 50+ legal document templates with guided form builder. Create, customize, and save your own templates.', 'Legal templates and form builder', 'Layout', 'flat', 0, 0, 24, true),
-- Consulting (25-26)
('RON Onboarding Consulting', 'consulting', 'Expert guidance for notaries and businesses setting up Remote Online Notarization. Includes platform selection, compliance review, and training.', 'RON setup consulting for notaries', 'GraduationCap', 'flat', 150, 500, 25, true),
('Workflow Audit & Automation', 'consulting', 'Analysis and optimization of your document workflow. Identify bottlenecks, implement automation, and improve efficiency.', 'Document workflow optimization', 'Workflow', 'custom', 0, 0, 26, true),
-- Business Services (27-29)
('Email Management & Correspondence', 'business_services', 'Professional email drafting, inbox management, and correspondence handling for busy professionals and businesses.', 'Professional email and inbox management', 'Mail', 'flat', 25, 75, 27, true),
('Certified Document Prep for Agencies', 'business_services', 'Specialized document preparation for government agencies, courts, and regulatory bodies. Includes formatting to agency specifications.', 'Agency-compliant document prep', 'ClipboardList', 'flat', 50, 150, 28, true),
('Registered Agent Coordination', 'business_services', 'Coordination with registered agents for business formation documents, annual reports, and statutory filings.', 'Registered agent document coordination', 'Building2', 'flat', 50, 100, 29, true)
ON CONFLICT DO NOTHING;
