export type EntityStatus = "healthy" | "needs_attention" | "partial" | "missing";

export type SubComponent = {
  name: string;
  status: EntityStatus;
  route?: string;
  edgeFunction?: string;
  description: string;
};

export type PlatformEntity = {
  id: string;
  name: string;
  icon: string;
  domain: string;
  description: string;
  subComponents: SubComponent[];
};

export const PLATFORM_ENTITIES: PlatformEntity[] = [
  {
    id: "email-management",
    name: "Email Management",
    icon: "Mail",
    domain: "Communication",
    description: "IONOS IMAP/SMTP sync, automated emails, templates, deliverability",
    subComponents: [
      { name: "IONOS IMAP Sync", status: "healthy", edgeFunction: "ionos-email-sync", description: "Background email synchronization" },
      { name: "Email Compose/Send", status: "healthy", route: "/admin/email-management", description: "Rich text email composer" },
      { name: "Email Templates", status: "healthy", route: "/admin/settings", description: "Branded email template designer" },
      { name: "Auth Email Hook", status: "healthy", edgeFunction: "auth-email-hook", description: "Custom auth email delivery" },
      { name: "Appointment Emails", status: "healthy", edgeFunction: "send-appointment-emails", description: "Booking confirmations" },
      { name: "Reminder Emails", status: "healthy", edgeFunction: "send-appointment-reminders", description: "24hr/30min reminders" },
      { name: "Email Queue (pgmq)", status: "healthy", description: "Durable queue with retry/DLQ" },
      { name: "Signature Management", status: "healthy", description: "Custom email signatures" },
      { name: "Client Correspondence", status: "healthy", route: "/admin/client-emails", description: "Threaded client communications" },
    ],
  },
  {
    id: "services-catalog",
    name: "Services Catalog",
    icon: "BookOpen",
    domain: "Core Business",
    description: "14+ service categories with fuzzy search, detail pages, pricing",
    subComponents: [
      { name: "Service Listing Page", status: "healthy", route: "/services", description: "Filterable service catalog" },
      { name: "Service Detail Pages", status: "healthy", route: "/services/:slug", description: "Category-specific FAQs & checklists" },
      { name: "Service Constants", status: "healthy", description: "Centralized service definitions (serviceConstants.ts)" },
      { name: "Fee Calculator", status: "healthy", route: "/fee-calculator", description: "Dynamic pricing engine" },
      { name: "Service Pre-Qualifier", status: "healthy", description: "Readiness assessment widget" },
      { name: "Service Requests", status: "healthy", route: "/service-request", description: "Intake-only request module" },
    ],
  },
  {
    id: "appointments",
    name: "Appointments & Scheduling",
    icon: "Calendar",
    domain: "Core Business",
    description: "Booking flow, scheduling, reminders, rescheduling, calendar",
    subComponents: [
      { name: "Booking Wizard", status: "healthy", route: "/book", description: "Multi-step appointment booking" },
      { name: "Schedule Step", status: "healthy", description: "Date/time selection with availability" },
      { name: "Intake Fields", status: "healthy", description: "Signer details & document info" },
      { name: "Review & Confirm", status: "healthy", description: "Pre-submission review" },
      { name: "Confirmation Page", status: "healthy", route: "/confirmation", description: "Post-booking confirmation" },
      { name: "Calendar Download", status: "healthy", description: "ICS/Google Calendar export" },
      { name: "Double-Booking Prevention", status: "healthy", description: "DB trigger prevents conflicts" },
      { name: "Past Date Validation", status: "healthy", description: "DB trigger blocks past dates" },
      { name: "Draft Persistence", status: "healthy", description: "Save in-progress bookings" },
      { name: "Admin Appointments", status: "healthy", route: "/admin/appointments", description: "Manage all appointments" },
      { name: "Availability Calendar", status: "healthy", route: "/admin/availability", description: "Set notary availability" },
      { name: "Recurrence Rules", status: "partial", description: "Recurring appointment support" },
    ],
  },
  {
    id: "payments",
    name: "Payments & Billing",
    icon: "CreditCard",
    domain: "Financial",
    description: "Stripe integration, invoicing, receipts",
    subComponents: [
      { name: "Stripe Payment Form", status: "healthy", description: "Embedded payment collection" },
      { name: "Payment Intent Creation", status: "healthy", edgeFunction: "create-payment-intent", description: "Server-side Stripe intent" },
      { name: "Stripe Webhooks", status: "healthy", edgeFunction: "stripe-webhook", description: "Payment event processing" },
      { name: "Invoice Generator", status: "healthy", description: "Post-session invoice creation" },
      { name: "Revenue Dashboard", status: "healthy", route: "/admin/revenue", description: "Financial analytics" },
      { name: "Subscription Plans", status: "partial", route: "/plans", description: "Recurring subscription management" },
      { name: "Refund Processing", status: "needs_attention", description: "Manual refund workflow" },
    ],
  },
  {
    id: "documents",
    name: "Document Management",
    icon: "FileText",
    domain: "Core Business",
    description: "Upload, OCR, templates, versioning, e-seal verification",
    subComponents: [
      { name: "Document Upload", status: "healthy", description: "Client portal upload" },
      { name: "Bulk Upload", status: "healthy", description: "Multi-file drag & drop" },
      { name: "Mobile Upload", status: "healthy", route: "/mobile-upload", description: "Camera/file mobile upload" },
      { name: "Admin Document Review", status: "healthy", route: "/admin/documents", description: "Approve/reject documents" },
      { name: "Document Templates", status: "healthy", route: "/templates", description: "Pre-built notary templates" },
      { name: "Document Builder", status: "healthy", route: "/builder", description: "AI-powered doc creation" },
      { name: "OCR Digitization", status: "healthy", route: "/digitize", description: "Scan and extract text" },
      { name: "E-Seal Verification", status: "healthy", route: "/verify/:id", description: "Public document verification" },
      { name: "Tags & Collections", status: "healthy", description: "Document organization" },
      { name: "Expiry Reminders", status: "healthy", description: "Automated expiry alerts" },
      { name: "Version History", status: "healthy", description: "Document version tracking" },
    ],
  },
  {
    id: "ron-sessions",
    name: "RON Sessions",
    icon: "Video",
    domain: "Compliance",
    description: "Remote Online Notarization per Ohio ORC §147.66",
    subComponents: [
      { name: "Tech Check", status: "healthy", route: "/ron-session", description: "Camera/mic/browser check" },
      { name: "Identity Verification", status: "healthy", route: "/verify-id", description: "ID scan + credential check" },
      { name: "KBA Challenge", status: "healthy", description: "Knowledge-Based Auth (max 2 attempts)" },
      { name: "Recording Consent", status: "healthy", description: "Audio/video consent capture" },
      { name: "Signing Platform", status: "partial", description: "Manual mode works; API mode placeholder" },
      { name: "E-Seal Generation", status: "healthy", description: "Digital notary seal" },
      { name: "Journal Entry Auto-Create", status: "healthy", description: "Ohio-compliant journal entry" },
      { name: "Session Timeout (60min)", status: "healthy", description: "Auto-timeout inactive sessions" },
      { name: "Signer IP Capture", status: "healthy", description: "Ohio compliance requirement" },
      { name: "Location Attestation", status: "healthy", description: "Physical state recording" },
      { name: "Vital Records Block", status: "healthy", description: "Block birth/death certificates" },
      { name: "Session Timeout Warning", status: "healthy", description: "5-minute countdown alert" },
    ],
  },
  {
    id: "crm-leads",
    name: "CRM & Leads",
    icon: "Users",
    domain: "Sales",
    description: "Pipeline management, deal tracking, lead generation",
    subComponents: [
      { name: "Lead Portal", status: "healthy", route: "/admin/leads", description: "All leads with filtering" },
      { name: "CRM Pipeline", status: "healthy", route: "/admin/crm", description: "Deal stages & activities" },
      { name: "AI Chatbot Lead Capture", status: "healthy", description: "Conversational lead collection" },
      { name: "Email Lead Extraction", status: "healthy", edgeFunction: "extract-email-leads", description: "Auto-extract from emails" },
      { name: "Proposal Generation", status: "healthy", edgeFunction: "generate-lead-proposal", description: "AI-generated proposals" },
      { name: "Lead Sources Management", status: "healthy", description: "Multi-channel tracking" },
      { name: "HubSpot Sync", status: "needs_attention", edgeFunction: "hubspot-sync", description: "CRM synchronization" },
    ],
  },
  {
    id: "client-portal",
    name: "Client Portal",
    icon: "LayoutDashboard",
    domain: "User Experience",
    description: "Authenticated client dashboard for managing services",
    subComponents: [
      { name: "Dashboard Overview", status: "healthy", route: "/portal", description: "Summary cards & quick actions" },
      { name: "Documents Tab", status: "healthy", description: "Upload/view/download documents" },
      { name: "Chat Tab", status: "healthy", description: "Real-time messaging" },
      { name: "Appointments Tab", status: "healthy", description: "View upcoming/past appointments" },
      { name: "Correspondence Tab", status: "healthy", description: "Formal correspondence" },
      { name: "Service Requests Tab", status: "healthy", description: "Submit and track requests" },
      { name: "Progress Tracker", status: "healthy", description: "Visual timeline" },
      { name: "Account Settings", status: "healthy", route: "/account-settings", description: "Profile management" },
    ],
  },
  {
    id: "business-portal",
    name: "Business Portal",
    icon: "Building",
    domain: "User Experience",
    description: "Organization account management",
    subComponents: [
      { name: "Business Registration", status: "healthy", route: "/business-portal", description: "Create business profile" },
      { name: "Member Management", status: "healthy", description: "Add/remove authorized signers" },
      { name: "Business Documents", status: "healthy", description: "Organization documents" },
      { name: "Business Verification", status: "healthy", route: "/admin/business-clients", description: "Admin verification" },
    ],
  },
  {
    id: "admin-dashboard",
    name: "Admin Dashboard",
    icon: "Settings",
    domain: "Operations",
    description: "Administrative operations and management",
    subComponents: [
      { name: "Overview KPIs", status: "healthy", route: "/admin", description: "Key performance indicators" },
      { name: "Notary Journal", status: "healthy", route: "/admin/journal", description: "Ohio-compliant journal" },
      { name: "Revenue Analytics", status: "healthy", route: "/admin/revenue", description: "Financial dashboard" },
      { name: "Audit Log", status: "healthy", route: "/admin/audit-log", description: "System audit trail" },
      { name: "Team Management", status: "healthy", route: "/admin/team", description: "Notary invites & roles" },
      { name: "Task Queue", status: "healthy", route: "/admin/task-queue", description: "Prioritized task management" },
      { name: "Content Workspace", status: "healthy", route: "/admin/content-workspace", description: "AI content creation" },
      { name: "Integration Hub", status: "healthy", route: "/admin/integrations", description: "Third-party services" },
    ],
  },
  {
    id: "ai-services",
    name: "AI Services",
    icon: "Brain",
    domain: "Intelligence",
    description: "AI-powered extraction, drafting, compliance, and analysis",
    subComponents: [
      { name: "Smart Extractors", status: "healthy", route: "/ai-extractors", description: "Legal/Finance/HR extraction" },
      { name: "Cross-Document Synthesis", status: "healthy", description: "RAG multi-document querying" },
      { name: "Compliance Watchdog", status: "healthy", description: "Real-time compliance auditing" },
      { name: "Style-Match Drafting", status: "healthy", description: "Client-specific tone matching" },
      { name: "AI Writer", status: "healthy", route: "/ai-writer", description: "AI-powered content creation" },
      { name: "Document Detection", status: "healthy", edgeFunction: "detect-document", description: "Auto-classify documents" },
      { name: "Client Assistant", status: "healthy", edgeFunction: "client-assistant", description: "AI chat for clients" },
      { name: "Notary Assistant", status: "healthy", edgeFunction: "notary-assistant", description: "AI chat for notaries" },
    ],
  },
  {
    id: "authentication",
    name: "Authentication & Security",
    icon: "Shield",
    domain: "Security",
    description: "User auth, roles, session management",
    subComponents: [
      { name: "Email/Password Auth", status: "healthy", route: "/login", description: "Standard authentication" },
      { name: "Signup Flow", status: "healthy", route: "/signup", description: "User registration" },
      { name: "Password Recovery", status: "healthy", route: "/forgot-password", description: "Password reset flow" },
      { name: "Role-Based Access", status: "healthy", description: "Admin/notary/client roles" },
      { name: "Protected Routes", status: "healthy", description: "Route guard component" },
      { name: "MFA", status: "needs_attention", description: "Multi-factor authentication (deferred)" },
      { name: "Session Management", status: "healthy", description: "Auto-refresh tokens" },
    ],
  },
  {
    id: "notifications",
    name: "Notifications & Alerts",
    icon: "Bell",
    domain: "Communication",
    description: "Email reminders, session alerts, system notifications",
    subComponents: [
      { name: "Appointment Reminders", status: "healthy", description: "24hr/30min automated emails" },
      { name: "Session Timeout Warning", status: "healthy", description: "RON session countdown" },
      { name: "Document Expiry Alerts", status: "healthy", description: "Upcoming expiry notifications" },
      { name: "Admin Notification Center", status: "healthy", description: "In-app admin alerts" },
      { name: "Cookie Consent", status: "healthy", description: "GDPR compliance banner" },
      { name: "Compliance Banner", status: "healthy", description: "Ohio compliance notices" },
    ],
  },
];

export function getEntityHealth(entity: PlatformEntity): { status: EntityStatus; healthPct: number } {
  const total = entity.subComponents.length;
  const healthy = entity.subComponents.filter(s => s.status === "healthy").length;
  const partial = entity.subComponents.filter(s => s.status === "partial").length;
  const needsAttention = entity.subComponents.filter(s => s.status === "needs_attention").length;
  const missing = entity.subComponents.filter(s => s.status === "missing").length;
  const pct = Math.round(((healthy + partial * 0.5) / total) * 100);

  if (missing > 0 || needsAttention > 2) return { status: "needs_attention", healthPct: pct };
  if (partial > 0 || needsAttention > 0) return { status: "partial", healthPct: pct };
  return { status: "healthy", healthPct: pct };
}
