import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, FileText, Calendar, Shield, Monitor, MapPin, Calculator,
  Users, PenTool, Scan, Mail, BookOpen, Scale, Sparkles, Settings,
  BarChart3, MessageSquare, ClipboardList, Briefcase, Layout, Lock,
  UserPlus, LogIn, HelpCircle, Star,
} from "lucide-react";

type RouteItem = { label: string; path: string; icon: any; keywords?: string };

const publicRoutes: RouteItem[] = [
  { label: "Home", path: "/", icon: Home, keywords: "landing main" },
  { label: "Services", path: "/services", icon: FileText, keywords: "notary document" },
  { label: "Book Appointment", path: "/book", icon: Calendar, keywords: "schedule meeting" },
  { label: "About", path: "/about", icon: HelpCircle, keywords: "info company" },
  { label: "Fee Calculator", path: "/fee-calculator", icon: Calculator, keywords: "pricing cost" },
  { label: "Document Templates", path: "/templates", icon: Layout, keywords: "forms legal" },
  { label: "Document Digitization", path: "/digitize", icon: Scan, keywords: "ocr scan" },
  { label: "AI Writing Tools", path: "/ai-writer", icon: Sparkles, keywords: "email social generate" },
  { label: "Document Builder", path: "/builder", icon: PenTool, keywords: "create form" },
  { label: "RON Info", path: "/ron-info", icon: Monitor, keywords: "remote online notarization" },
  { label: "RON Eligibility Checker", path: "/ron-check", icon: Shield, keywords: "check qualify" },
  { label: "Notary Guide", path: "/notary-guide", icon: BookOpen, keywords: "how to" },
  { label: "Loan Signing", path: "/loan-signing", icon: Scale, keywords: "title company" },
  { label: "Verify E-Seal", path: "/verify/check", icon: Shield, keywords: "validate seal" },
  { label: "Join Platform", path: "/join", icon: UserPlus, keywords: "notary apply" },
];

const portalRoutes: RouteItem[] = [
  { label: "Client Portal", path: "/portal", icon: Lock, keywords: "dashboard my account" },
  { label: "Virtual Mailroom", path: "/mailroom", icon: Mail, keywords: "mail inbox" },
  { label: "Service Request", path: "/request", icon: ClipboardList, keywords: "submit intake" },
  { label: "Subscription Plans", path: "/subscribe", icon: Star, keywords: "pricing plans" },
  { label: "Business Portal", path: "/business-portal", icon: Briefcase, keywords: "company team" },
  { label: "Verify Identity", path: "/verify-id", icon: Shield, keywords: "kyc id" },
];

const adminRoutes: RouteItem[] = [
  { label: "Admin Overview", path: "/admin", icon: BarChart3, keywords: "dashboard stats" },
  { label: "Appointments", path: "/admin/appointments", icon: Calendar, keywords: "schedule bookings" },
  { label: "Clients", path: "/admin/clients", icon: Users, keywords: "customers contacts" },
  { label: "Documents", path: "/admin/documents", icon: FileText, keywords: "files uploads" },
  { label: "Journal", path: "/admin/journal", icon: BookOpen, keywords: "notary log entries" },
  { label: "Revenue", path: "/admin/revenue", icon: BarChart3, keywords: "payments earnings" },
  { label: "Chat", path: "/admin/chat", icon: MessageSquare, keywords: "messages conversations" },
  { label: "Templates", path: "/admin/templates", icon: Layout, keywords: "forms library" },
  { label: "Apostille", path: "/admin/apostille", icon: Shield, keywords: "international" },
  { label: "Services Management", path: "/admin/services", icon: FileText, keywords: "catalog" },
  { label: "Business Clients", path: "/admin/business-clients", icon: Briefcase },
  { label: "Team", path: "/admin/team", icon: Users, keywords: "notaries staff" },
  { label: "Email Management", path: "/admin/email-management", icon: Mail },
  { label: "Lead Portal", path: "/admin/leads", icon: UserPlus, keywords: "prospects" },
  { label: "CRM", path: "/admin/crm", icon: Users, keywords: "deals pipeline contacts" },
  { label: "AI Assistant", path: "/admin/ai-assistant", icon: Sparkles },
  { label: "Audit Log", path: "/admin/audit-log", icon: ClipboardList },
  { label: "Availability", path: "/admin/availability", icon: Calendar, keywords: "time slots" },
  { label: "Service Requests", path: "/admin/service-requests", icon: ClipboardList, keywords: "intake" },
  { label: "Task Queue", path: "/admin/task-queue", icon: ClipboardList, keywords: "tasks queue" },
  { label: "Performance", path: "/admin/performance", icon: BarChart3, keywords: "analytics metrics" },
  { label: "Compliance Report", path: "/admin/compliance-report", icon: Shield, keywords: "compliance audit" },
  { label: "Build Tracker", path: "/admin/build-tracker", icon: Settings, keywords: "bugs gaps tracker" },
  { label: "Resources", path: "/admin/resources", icon: BookOpen },
  { label: "Settings", path: "/admin/settings", icon: Settings, keywords: "config" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, isNotary } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const openPalette = useCallback(() => setOpen(true), []);

  return (
    <>
      {/* Mobile search trigger */}
      <button
        onClick={openPalette}
        className="md:hidden fixed bottom-[7.5rem] left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-muted shadow-lg border border-border"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, tools, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {publicRoutes.map((r) => (
            <CommandItem key={r.path} onSelect={() => go(r.path)} keywords={[r.keywords || ""]}>
              <r.icon className="mr-2 h-4 w-4" />
              {r.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {user && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your Portal">
              {portalRoutes.map((r) => (
                <CommandItem key={r.path} onSelect={() => go(r.path)} keywords={[r.keywords || ""]}>
                  <r.icon className="mr-2 h-4 w-4" />
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {(isAdmin || isNotary) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              {adminRoutes.map((r) => (
                <CommandItem key={r.path} onSelect={() => go(r.path)} keywords={[r.keywords || ""]}>
                  <r.icon className="mr-2 h-4 w-4" />
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!user && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => go("/login")} keywords={["sign in"]}>
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </CommandItem>
              <CommandItem onSelect={() => go("/signup")} keywords={["register create"]}>
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
    </>
  );
}
