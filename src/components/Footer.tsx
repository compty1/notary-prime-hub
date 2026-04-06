import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail } from "lucide-react";

interface FooterProps {
  phone?: string;
  email?: string;
}

export function Footer({ phone = "(614) 300-6890", email = "contact@notardex.com" }: FooterProps) {
  return (
    <footer className="border-t border-border bg-sidebar-background text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12 bg-sidebar-background">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo size="sm" showText subtitle="Notary & Document Services" theme="dark" />
            <p className="mt-3 text-sm text-sidebar-foreground/60">
              Professional notary team serving Franklin County and the greater Columbus area.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-sidebar-foreground">Services</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <Link to="/book" className="block transition-colors hover:text-primary">Book Appointment</Link>
              <Link to="/services" className="block transition-colors hover:text-primary">All Services</Link>
              <Link to="/loan-signing" className="block transition-colors hover:text-primary">Loan Signing</Link>
              <Link to="/templates" className="block transition-colors hover:text-primary">Templates</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-sidebar-foreground">Solutions</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <Link to="/solutions/notaries" className="block transition-colors hover:text-primary">For Notaries</Link>
              <Link to="/solutions/hospitals" className="block transition-colors hover:text-primary">For Hospitals</Link>
              <Link to="/solutions/real-estate" className="block transition-colors hover:text-primary">For Real Estate</Link>
              <Link to="/solutions/law-firms" className="block transition-colors hover:text-primary">For Law Firms</Link>
              <Link to="/solutions/small-business" className="block transition-colors hover:text-primary">For Small Business</Link>
              <Link to="/solutions/individuals" className="block transition-colors hover:text-primary">For Individuals</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-sidebar-foreground">Resources</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <Link to="/fee-calculator" className="block transition-colors hover:text-primary">Pricing</Link>
              <Link to="/ron-check" className="block transition-colors hover:text-primary">RON Eligibility</Link>
              <Link to="/ron-info" className="block transition-colors hover:text-primary">RON Info</Link>
              <Link to="/notary-guide" className="block transition-colors hover:text-primary">Notary Guide</Link>
              <Link to="/about" className="block transition-colors hover:text-primary">About</Link>
              <Link to="/help" className="block transition-colors hover:text-primary">Help & Support</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-sidebar-foreground">Contact</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
              <p className="text-xs text-sidebar-foreground/50">Columbus, OH 43215 · Franklin County</p>
              <Link to="/join" className="block transition-colors hover:text-primary">Join as Provider</Link>
              <Link to="/login" className="block transition-colors hover:text-primary">Client Portal</Link>
              <Link to="/signer-rights" className="block transition-colors hover:text-primary">Signer Bill of Rights</Link>
              <a href="https://www.ohiosos.gov/notary/" target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-primary text-xs">Ohio SOS Notary Search ↗</a>
            </div>
          </div>
        </div>
        {/* Business Hours */}
        <div className="mt-8 border-t border-sidebar-border pt-6 text-center text-sm text-sidebar-foreground/60">
          <p className="mb-1 font-semibold text-sidebar-foreground text-xs uppercase tracking-wider">Hours of Operation</p>
          <p>Mon–Fri 9am–7pm ET &nbsp;|&nbsp; Sat 10am–4pm ET &nbsp;|&nbsp; Sun by appointment</p>
        </div>

        {/* Payment Methods */}
        <div className="mt-4 text-center text-xs text-sidebar-foreground/50">
          <p>We accept: Credit/Debit &nbsp;•&nbsp; Venmo &nbsp;•&nbsp; Zelle &nbsp;•&nbsp; CashApp &nbsp;•&nbsp; Cash (in-person only)</p>
        </div>

        {/* UPL Disclaimer */}
        <div className="mt-4 text-center text-xs text-sidebar-foreground/40 max-w-2xl mx-auto">
          <p>Notar is not a law firm. Our notaries are not attorneys and cannot provide legal advice, draft legal documents, or advise on the content of any document. (ORC §147.01)</p>
        </div>
        <div className="mt-2 text-center text-xs text-sidebar-foreground/40 max-w-2xl mx-auto">
          <p>$25,000 surety bond &amp; E&amp;O insurance maintained. All notaries are background-checked and Ohio-commissioned. <Badge className="bg-primary/20 text-primary text-[10px] ml-1">Insured & Bonded</Badge></p>
        </div>

        <div className="mt-4 border-t border-sidebar-border pt-4 text-center text-xs text-sidebar-foreground/50">
          <p>© {new Date().getFullYear()} Notar. All rights reserved. Ohio Notary & Document Services — Franklin County</p>
          <nav className="mt-2 flex items-center justify-center gap-3" aria-label="Footer links">
            <Link to="/terms" className="transition-colors hover:text-primary">Terms</Link>
            <span className="text-sidebar-border" aria-hidden="true">·</span>
            <Link to="/terms#privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <span className="text-sidebar-border" aria-hidden="true">·</span>
            <Link to="/resources" className="transition-colors hover:text-primary">Resources</Link>
            <span className="text-sidebar-border" aria-hidden="true">·</span>
            <a href="https://www.ohiosos.gov/notary/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary" aria-label="Ohio SOS Notary">Ohio SOS ↗</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
