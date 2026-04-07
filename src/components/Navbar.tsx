import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Menu, ChevronDown } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const serviceCategories = [
  { key: "notarization", label: "Core Notarization", desc: "RON, in-person, witness services" },
  { key: "document_services", label: "Document Services", desc: "Preparation, scanning, formatting" },
  { key: "verification", label: "Identity & Verification", desc: "ID checks, I-9, KYC" },
  { key: "business", label: "Business & Volume", desc: "Bulk packages, API, subscriptions" },
  { key: "authentication", label: "Authentication & Intl.", desc: "Apostille, translation" },
  { key: "admin_support", label: "Administrative Support", desc: "Data entry, travel, admin tasks" },
  { key: "content_creation", label: "Content Creation", desc: "Blog posts, social media" },
  { key: "customer_service", label: "Customer Service", desc: "Email & chat support" },
];

const solutionLinks = [
  { to: "/solutions/notaries", label: "For Notaries", desc: "Tools for notary professionals" },
  { to: "/solutions/hospitals", label: "For Hospitals", desc: "Bedside & facility notarization" },
  { to: "/solutions/real-estate", label: "For Real Estate", desc: "Closings & title services" },
  { to: "/solutions/law-firms", label: "For Law Firms", desc: "Legal document notarization" },
  { to: "/solutions/small-business", label: "For Small Business", desc: "Affordable business packages" },
  { to: "/solutions/individuals", label: "For Individuals", desc: "Personal document services" },
];

const toolLinks = [
  { to: "/docudex", label: "DocuDex Editor" },
  { to: "/ai-tools", label: "AI Tools Hub" },
  { to: "/ai-writer", label: "AI Writer" },
  { to: "/grants", label: "Grant Generator" },
  { to: "/resume-builder", label: "Resume Builder" },
  { to: "/signature-generator", label: "Signature Generator" },
];

const plainLinks = [
  { to: "/about", label: "About" },
  { to: "/templates", label: "Templates" },
  { to: "/fee-calculator", label: "Pricing" },
  { to: "/help", label: "Help" },
];

function DropdownNav({ label, linkTo, children }: { label: string; linkTo?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {linkTo ? (
          <Link
            to={linkTo}
            className="relative px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            {label}
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm font-medium text-slate-300 cursor-default">{label}</span>
        )}
        <PopoverTrigger asChild>
          <button className="-ml-2 p-1 text-slate-300 hover:text-white transition-colors" aria-label={`${label} menu`}>
            <ChevronDown className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[420px] p-4"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </PopoverContent>
      </div>
    </Popover>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [solutionsExpanded, setSolutionsExpanded] = useState(false);
  const { user, isAdmin, isNotary } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const portalLink = isAdmin || isNotary ? "/admin" : "/portal";
  const portalLabel = isAdmin || isNotary ? "Dashboard" : "Portal";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(222,47%,5%)] shadow-lg" aria-label="Main navigation">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            NotarDex<span className="text-primary">.com</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {/* Services Dropdown */}
          <DropdownNav label="Services" linkTo="/services">
            <div className="grid grid-cols-2 gap-2">
              {serviceCategories.map((cat) => (
                <Link
                  key={cat.key}
                  to={`/services?category=${cat.key}`}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <Link to="/services" className="text-sm font-medium text-primary hover:underline">
                View All Services →
              </Link>
            </div>
          </DropdownNav>

          {/* Solutions Dropdown */}
          <DropdownNav label="Solutions">
            <div className="space-y-1">
              {solutionLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DropdownNav>

          {/* Tools Dropdown */}
          <DropdownNav label="Tools" linkTo="/ai-tools">
            <div className="space-y-1">
              {toolLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                </Link>
              ))}
            </div>
          </DropdownNav>

          {plainLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-2">
            <DarkModeToggle />
            {user ? (
              <Link to={portalLink}>
                <Button variant="ghost" size="sm" className="text-sm text-slate-300 hover:text-white hover:bg-white/10">{portalLabel}</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="outline" className="rounded-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 text-sm">Sign In</Button>
              </Link>
            )}
            <Link to="/book">
              <Button size="sm" className="rounded-full glow-amber font-semibold">
                Notarize Now
              </Button>
            </Link>
          </div>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" className="text-slate-300 hover:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background">
            <div className="mt-8 flex flex-col gap-1">
              {/* Services collapsible */}
              <button
                onClick={() => setServicesExpanded(!servicesExpanded)}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Services
                <ChevronDown className={cn("h-4 w-4 transition-transform", servicesExpanded && "rotate-180")} />
              </button>
              {servicesExpanded && (
                <div className="ml-4 space-y-1">
                  <Link to="/services" className="block rounded-lg px-4 py-2 text-sm text-primary font-medium hover:bg-muted">All Services</Link>
                  {serviceCategories.map((cat) => (
                    <Link key={cat.key} to={`/services?category=${cat.key}`} className="block rounded-lg px-4 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Solutions collapsible */}
              <button
                onClick={() => setSolutionsExpanded(!solutionsExpanded)}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Solutions
                <ChevronDown className={cn("h-4 w-4 transition-transform", solutionsExpanded && "rotate-180")} />
              </button>
              {solutionsExpanded && (
                <div className="ml-4 space-y-1">
                  {solutionLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="block rounded-lg px-4 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to="/ai-tools"
                className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                AI Tools Hub
              </Link>

              {plainLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3 border-border" />
              <div className="flex items-center gap-2 px-4 py-2">
                <DarkModeToggle />
                <span className="text-sm text-muted-foreground">Dark Mode</span>
              </div>
              {user ? (
                <Link to={portalLink}>
                  <Button variant="outline" className="w-full">{portalLabel}</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
              )}
              <Link to="/book">
                <Button className="w-full font-semibold">Notarize Now</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}