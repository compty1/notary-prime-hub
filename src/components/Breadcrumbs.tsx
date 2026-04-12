import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";
import { BREADCRUMB_LABELS } from "@/lib/breadcrumbLabels";

const labelMap: Record<string, string> = {
  services: "Services",
  book: "Book Appointment",
  portal: "Client Portal",
  admin: "Dashboard",
  login: "Sign In",
  signup: "Sign Up",
  about: "About",
  templates: "Templates",
  digitize: "Digitize",
  "fee-calculator": "Pricing",
  "ron-info": "RON Info",
  "ron-check": "RON Eligibility",
  "loan-signing": "Loan Signing",
  terms: "Terms & Privacy",
  join: "Join Platform",
  request: "Service Request",
  mailroom: "Virtual Mailroom",
  subscribe: "Subscriptions",
  appointments: "Appointments",
  clients: "Clients",
  availability: "Availability",
  documents: "Documents",
  journal: "Journal",
  revenue: "Revenue",
  settings: "Settings",
  "ai-assistant": "AI Assistant",
  "audit-log": "Audit Log",
  team: "Team",
  "email-management": "Email",
  leads: "Leads",
  integrations: "Integrations",
  chat: "Chat",
  "business-clients": "Business Clients",
  resources: "Resources",
  apostille: "Apostille",
  solutions: "Solutions",
  notaries: "Notaries",
  hospitals: "Hospitals",
  "real-estate": "Real Estate",
  "law-firms": "Law Firms",
  "small-business": "Small Business",
  individuals: "Individuals",
  "ai-writer": "AI Writer",
  "ai-extractors": "AI Document Intelligence",
  "ai-knowledge": "Knowledge Base",
  confirmation: "Confirmation",
  "document-builder": "Document Builder",
  "notary-guide": "Notary Guide",
  "notary-process": "Notary Process",
  grants: "Grant Dashboard",
  "resume-builder": "Resume Builder",
  "signature-generator": "Signature Generator",
  "verify-seal": "Verify E-Seal",
  "verify-identity": "Verify Identity",
  unsubscribe: "Unsubscribe",
  "business-portal": "Business Portal",
  "forgot-password": "Reset Password",
  "docudex-pro": "DocuDex Pro",
  "build-tracker": "Build Tracker",
  overview: "Overview",
  performance: "Performance",
  webhooks: "Webhooks",
  "task-queue": "Task Queue",
  "process-flows": "Process Flows",
  "content-workspace": "Content Workspace",
  "compliance-report": "Compliance Report",
  "automated-emails": "Automated Emails",
  "integration-test": "Integration Test",
  "session-tracker": "Session Tracker",
  "ai-tools": "AI Tools",
  mailbox: "Mailbox",
  crm: "CRM",
  users: "Users",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: labelMap[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  // Emit BreadcrumbList JSON-LD
  useEffect(() => {
    if (segments.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://notardex.com" },
        ...crumbs.map((c, i) => ({
          "@type": "ListItem",
          "position": i + 2,
          "name": c.label,
          "item": `https://notardex.com${c.path}`,
        })),
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [pathname]);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-foreground transition-colors" aria-label="Home">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {crumb.isLast ? (
              <span className="font-medium text-foreground" aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
