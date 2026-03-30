import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Phone, Mail } from "lucide-react";

interface FooterProps {
  phone?: string;
  email?: string;
}

export function Footer({ phone = "(614) 300-6890", email = "contact@notardex.com" }: FooterProps) {
  return (
    <footer className="border-t border-border bg-sidebar-background text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo size="sm" showText subtitle="Notary & Document Services" />
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
            <h4 className="mb-3 font-heading text-sm font-semibold text-sidebar-foreground">Resources</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <Link to="/fee-calculator" className="block transition-colors hover:text-primary">Pricing</Link>
              <Link to="/ron-check" className="block transition-colors hover:text-primary">RON Eligibility</Link>
              <Link to="/ron-info" className="block transition-colors hover:text-primary">RON Info</Link>
              <Link to="/notary-guide" className="block transition-colors hover:text-primary">Notary Guide</Link>
              <Link to="/about" className="block transition-colors hover:text-primary">About</Link>
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
              <Link to="/join" className="block transition-colors hover:text-primary">Join as Provider</Link>
              <Link to="/login" className="block transition-colors hover:text-primary">Client Portal</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-sidebar-border pt-6 text-center text-xs text-sidebar-foreground/50">
          <p>© {new Date().getFullYear()} Notar. All rights reserved. Ohio Notary & Document Services — Franklin County</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Link to="/terms" className="transition-colors hover:text-primary">Terms</Link>
            <span className="text-sidebar-border">·</span>
            <Link to="/terms" className="transition-colors hover:text-primary">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
