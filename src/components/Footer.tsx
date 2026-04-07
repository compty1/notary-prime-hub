import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Phone, Mail, ShieldCheck, Lock } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface FooterProps {
  phone?: string;
  email?: string;
}

export function Footer({ phone = BRAND.defaultPhone, email = BRAND.defaultEmail }: FooterProps) {
  return (
    <footer className="border-t border-sidebar-border bg-[hsl(222_47%_4%)] text-slate-400">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo size="sm" showText subtitle="Notary & Document Services" theme="dark" />
            <p className="mt-3 text-sm text-slate-500">
              Safe, secure, and legally binding remote online notarization services available 24/7. Your trusted digital partner.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-white">Platform</h4>
            <div className="space-y-2 text-sm">
              <Link to="/book" className="block transition-colors hover:text-primary">Book Appointment</Link>
              <Link to="/services" className="block transition-colors hover:text-primary">Services</Link>
              <Link to="/loan-signing" className="block transition-colors hover:text-primary">Loan Signing</Link>
              <Link to="/fee-calculator" className="block transition-colors hover:text-primary">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-white">Solutions</h4>
            <div className="space-y-2 text-sm">
              <Link to="/solutions/notaries" className="block transition-colors hover:text-primary">For Notaries</Link>
              <Link to="/solutions/hospitals" className="block transition-colors hover:text-primary">For Hospitals</Link>
              <Link to="/solutions/real-estate" className="block transition-colors hover:text-primary">For Real Estate</Link>
              <Link to="/solutions/law-firms" className="block transition-colors hover:text-primary">For Law Firms</Link>
              <Link to="/solutions/small-business" className="block transition-colors hover:text-primary">For Small Business</Link>
              <Link to="/solutions/individuals" className="block transition-colors hover:text-primary">For Individuals</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-white">Resources</h4>
            <div className="space-y-2 text-sm">
              <Link to="/ron-check" className="block transition-colors hover:text-primary">RON Eligibility</Link>
              <Link to="/ron-info" className="block transition-colors hover:text-primary">RON Info</Link>
              <Link to="/notary-guide" className="block transition-colors hover:text-primary">Notary Guide</Link>
              <Link to="/notary-certificates" className="block transition-colors hover:text-primary">Certificates Guide</Link>
              <Link to="/templates" className="block transition-colors hover:text-primary">Templates</Link>
              <Link to="/about" className="block transition-colors hover:text-primary">About</Link>
              <Link to="/help" className="block transition-colors hover:text-primary">Help & Support</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold text-white">Legal</h4>
            <div className="space-y-2 text-sm">
              <Link to="/terms" className="block transition-colors hover:text-primary">Terms of Service</Link>
              <Link to="/terms#privacy" className="block transition-colors hover:text-primary">Privacy Policy</Link>
              <Link to="/signer-rights" className="block transition-colors hover:text-primary">Signer Bill of Rights</Link>
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
            </div>
          </div>
        </div>

        {/* UPL Disclaimer */}
        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          <p>NotarDex is not a law firm. Our notaries are not attorneys and cannot provide legal advice, draft legal documents, or advise on the content of any document. (ORC §147.01)</p>
        </div>
        <div className="mt-2 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          <p>$25,000 surety bond &amp; E&amp;O insurance maintained. All notaries are background-checked and Ohio-commissioned.</p>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-4 text-center text-sm flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} NotarDex.com. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="flex items-center gap-1 text-xs"><ShieldCheck className="w-4 h-4 text-emerald-500" /> SOC 2 Type II</span>
            <span className="flex items-center gap-1 text-xs"><Lock className="w-4 h-4 text-emerald-500" /> 256-bit Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
}