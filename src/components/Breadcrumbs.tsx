import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

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
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelMap[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

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
