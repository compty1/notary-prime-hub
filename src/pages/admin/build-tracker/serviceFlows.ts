export type FlowStep = {
  name: string;
  description: string;
  route?: string;
  component?: string;
  implemented: boolean;
  issues?: string[];
};

export type ServiceFlow = {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
};

export const SERVICE_FLOWS: ServiceFlow[] = [
  {
    id: "booking",
    name: "Booking Flow",
    description: "End-to-end appointment scheduling for notary services",
    steps: [
      { name: "Landing / CTA", description: "User clicks Book from homepage or nav", route: "/", component: "Index", implemented: true },
      { name: "Service Selection", description: "Choose notarization type and service category", route: "/book", component: "BookAppointment", implemented: true },
      { name: "Date & Time Selection", description: "Pick available date/time slot", route: "/book", component: "BookingScheduleStep", implemented: true },
      { name: "Intake Form", description: "Signer details, document info, entity name, capacity", route: "/book", component: "BookingIntakeFields", implemented: true },
      { name: "Review & Confirm", description: "Review all details before submission", route: "/book", component: "BookingReviewStep", implemented: true },
      { name: "Payment Processing", description: "Stripe payment intent creation and collection", route: "/book", component: "PaymentForm", implemented: true },
      { name: "Confirmation Page", description: "Show confirmation number, calendar download, next steps", route: "/confirmation", component: "AppointmentConfirmation", implemented: true },
      { name: "Confirmation Email", description: "Automated email sent to client and admin", route: undefined, component: "send-appointment-emails", implemented: true },
      { name: "Reminder Emails", description: "Automated 24h/1h reminders before appointment", route: undefined, component: "send-appointment-reminders", implemented: true },
      { name: "Double-booking Prevention", description: "DB trigger prevents same time slot overlap", route: undefined, component: "prevent_double_booking", implemented: true },
      { name: "Past Date Validation", description: "DB trigger blocks past-date bookings", route: undefined, component: "validate_appointment_date", implemented: true },
      { name: "Booking Draft Persistence", description: "Save in-progress booking for authenticated users", route: "/book", component: "booking_drafts", implemented: true },
    ],
  },
  {
    id: "ron-session",
    name: "RON Session Flow",
    description: "Remote Online Notarization compliant with Ohio ORC §147.66",
    steps: [
      { name: "RON Appointment Booking", description: "Schedule RON-type appointment", route: "/book", implemented: true },
      { name: "Tech Check", description: "Camera, mic, browser compatibility check", route: "/ron-session", component: "TechCheck", implemented: true },
      { name: "Identity Verification", description: "ID scan and credential-based verification", route: "/verify-id", component: "VerifyIdentity", implemented: true },
      { name: "KBA Challenge", description: "Knowledge-Based Authentication (max 2 attempts per Ohio law)", route: "/ron-session", component: "KBAVerification", implemented: true },
      { name: "Recording Consent", description: "Audio/video recording consent capture with timestamp", route: "/ron-session", component: "ESignConsent", implemented: true },
      { name: "Signing Platform (Manual Mode)", description: "Paste signing link from SignNow/DocuSign/etc.", route: "/ron-session", implemented: true },
      { name: "Signing Platform (API Mode)", description: "Direct API integration with signing platform", route: "/ron-session", implemented: false, issues: ["API mode is placeholder only — no live integration"] },
      { name: "E-Seal Generation", description: "Generate digital notary seal for completed documents", route: "/verify/:id", component: "ESealEmbed", implemented: true },
      { name: "Journal Entry", description: "Auto-create notary journal entry with all required Ohio fields", route: "/admin/journal", component: "AdminJournal", implemented: true },
      { name: "Invoice Generation", description: "Auto-generate invoice for completed session", route: undefined, component: "InvoiceGenerator", implemented: true },
      { name: "Signer IP Capture", description: "Capture client IP for Ohio compliance", route: "/ron-session", implemented: true },
      { name: "Signer Location Attestation", description: "Record signer's physical location state", route: "/ron-session", implemented: true },
      { name: "Session Timeout (60 min)", description: "Auto-timeout inactive sessions", route: "/ron-session", implemented: true },
      { name: "Ohio Vital Records Block", description: "Prevent notarization of birth/death certificates", route: undefined, component: "ohioDocumentEligibility", implemented: true },
    ],
  },
  {
    id: "client-portal",
    name: "Client Portal Flow",
    description: "Authenticated client dashboard for managing notary services",
    steps: [
      { name: "Login / Signup", description: "Email/password authentication", route: "/login", implemented: true },
      { name: "Dashboard Overview", description: "Summary cards for appointments, documents, messages", route: "/portal", component: "ClientPortal", implemented: true },
      { name: "Documents Tab", description: "Upload, view, download documents", route: "/portal", component: "PortalDocumentsTab", implemented: true },
      { name: "Chat Tab", description: "Real-time messaging with admin/notary", route: "/portal", component: "PortalChatTab", implemented: true },
      { name: "Appointments Tab", description: "View upcoming and past appointments", route: "/portal", component: "PortalAppointmentsTab", implemented: true },
      { name: "Correspondence Tab", description: "View formal correspondence from notary", route: "/portal", component: "PortalCorrespondenceTab", implemented: true },
      { name: "Service Requests Tab", description: "Submit and track service requests", route: "/portal", component: "PortalServiceRequestsTab", implemented: true },
      { name: "Lead Capture Tab", description: "View lead activity (if applicable)", route: "/portal", component: "PortalLeadsTab", implemented: true },
      { name: "Account Settings", description: "Update profile, password, notification preferences", route: "/account-settings", component: "AccountSettings", implemented: true },
      { name: "Progress Tracker", description: "Visual timeline showing appointment/session progress", route: "/portal", component: "ClientProgressTracker", implemented: true },
    ],
  },
  {
    id: "business-portal",
    name: "Business Portal Flow",
    description: "Business account management for organizations",
    steps: [
      { name: "Business Registration", description: "Create business profile with EIN, type, articles", route: "/business-portal", component: "BusinessPortal", implemented: true },
      { name: "Member Management", description: "Add/remove authorized signers and members", route: "/business-portal", implemented: true },
      { name: "Business Documents", description: "Upload and manage business-specific documents", route: "/business-portal", implemented: true },
      { name: "Business Appointments", description: "Book on behalf of business entity", route: "/book", implemented: true },
      { name: "Business Verification", description: "Admin-side verification of business credentials", route: "/admin/business-clients", implemented: true },
    ],
  },
  {
    id: "document-flow",
    name: "Document Flow",
    description: "End-to-end document lifecycle management",
    steps: [
      { name: "Document Upload", description: "Client uploads document via portal or mobile", route: "/portal", implemented: true },
      { name: "Mobile Upload", description: "Camera/file upload from mobile device", route: "/mobile-upload", component: "MobileUpload", implemented: true },
      { name: "Document Review", description: "Admin reviews uploaded documents", route: "/admin/documents", component: "AdminDocuments", implemented: true },
      { name: "Document Templates", description: "Pre-built notary document templates", route: "/templates", component: "DocumentTemplates", implemented: true },
      { name: "Document Builder", description: "AI-powered document creation", route: "/builder", component: "DocumentBuilder", implemented: true },
      { name: "Document Digitization", description: "OCR and AI extraction from scanned docs", route: "/digitize", component: "DocumentDigitize", implemented: true },
      { name: "E-Seal Verification", description: "Public verification of notarized documents", route: "/verify/:id", component: "VerifySeal", implemented: true },
      { name: "Document Tags & Collections", description: "Organize documents with tags and collections", route: "/portal", implemented: true },
      { name: "Document Expiry Reminders", description: "Set and receive expiry reminders", route: "/portal", implemented: true },
    ],
  },
  {
    id: "lead-capture",
    name: "Lead Capture Flow",
    description: "Multi-channel lead generation and CRM pipeline",
    steps: [
      { name: "Website Contact Form", description: "Public contact form on homepage", route: "/", component: "AILeadChatbot", implemented: true },
      { name: "AI Chatbot Lead Capture", description: "Conversational chatbot collects lead info", route: "/", component: "AILeadChatbot", implemented: true },
      { name: "Loan Signing Inquiry", description: "Business lead form for loan signing services", route: "/loan-signing", implemented: true },
      { name: "Provider Application", description: "Notary application form", route: "/join", implemented: true },
      { name: "Email Lead Extraction", description: "Extract leads from inbound emails", route: undefined, component: "extract-email-leads", implemented: true },
      { name: "Lead Portal (Admin)", description: "Admin view of all leads with filtering", route: "/admin/leads", component: "AdminLeadPortal", implemented: true },
      { name: "CRM Pipeline", description: "Deal stages and activity tracking", route: "/admin/crm", component: "AdminCRM", implemented: true },
      { name: "Lead-to-Deal Conversion", description: "Convert qualified leads to deals", route: "/admin/crm", implemented: true },
      { name: "Proposal Generation", description: "AI-generated proposals for leads", route: undefined, component: "generate-lead-proposal", implemented: true },
    ],
  },
  {
    id: "admin-workflow",
    name: "Admin Workflow",
    description: "Complete administrative operations dashboard",
    steps: [
      { name: "Overview Dashboard", description: "KPI cards, recent activity, quick actions", route: "/admin", component: "AdminOverview", implemented: true },
      { name: "Appointments Management", description: "View, edit, assign, refuse appointments", route: "/admin/appointments", component: "AdminAppointments", implemented: true },
      { name: "Client Management", description: "View all clients with profiles and history", route: "/admin/clients", component: "AdminClients", implemented: true },
      { name: "Notary Journal", description: "Ohio-compliant notary journal with all required fields", route: "/admin/journal", component: "AdminJournal", implemented: true },
      { name: "Revenue Tracking", description: "Financial dashboard with payouts and fees", route: "/admin/revenue", component: "AdminRevenue", implemented: true },
      { name: "Document Management", description: "Review, approve, reject client documents", route: "/admin/documents", component: "AdminDocuments", implemented: true },
      { name: "Chat System", description: "Real-time admin-to-client messaging", route: "/admin/chat", component: "AdminChat", implemented: true },
      { name: "Email Management", description: "IONOS email sync, compose, drafts", route: "/admin/email-management", component: "AdminEmailManagement", implemented: true },
      { name: "Availability Calendar", description: "Set notary availability windows", route: "/admin/availability", component: "AdminAvailability", implemented: true },
      { name: "Team Management", description: "Invite notaries, manage roles", route: "/admin/team", component: "AdminTeam", implemented: true },
      { name: "Audit Log", description: "Complete audit trail of all system actions", route: "/admin/audit-log", component: "AdminAuditLog", implemented: true },
      { name: "Integration Hub", description: "Monitor all third-party service connections", route: "/admin/integrations", component: "AdminIntegrationTest", implemented: true },
      { name: "Build Tracker", description: "Project health and gap analysis", route: "/admin/build-tracker", component: "AdminBuildTracker", implemented: true },
      { name: "Service Requests", description: "Intake-only service request management", route: "/admin/service-requests", component: "AdminServiceRequests", implemented: true },
      { name: "Content Workspace", description: "AI-powered content creation tools", route: "/admin/content-workspace", component: "AdminContentWorkspace", implemented: true },
      { name: "Task Queue", description: "Prioritized task management", route: "/admin/task-queue", component: "AdminTaskQueue", implemented: true },
    ],
  },
];
