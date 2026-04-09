import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { MobileFAB } from "@/components/MobileFAB";
import { AILeadChatbot } from "@/components/AILeadChatbot";
import LegalGlossaryProvider from "@/components/LegalGlossaryProvider";
import { useSettings } from "@/hooks/useSettings";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

interface PageShellProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function PageShell({ children, hideNav = false, hideFooter = false }: PageShellProps) {
  const { pathname } = useLocation();
  const isInternalRoute = pathname.startsWith("/admin") || pathname.startsWith("/portal");
  const { get, isEnabled } = useSettings();

  const phone = get("notary_phone", "(614) 300-6890");
  const email = get("notary_email", "shane@notardex.com");
  const copyrightText = get("copyright_text", "");
  const cookieConsentEnabled = isEnabled("cookie_consent_enabled", true);
  const maintenanceMode = isEnabled("maintenance_mode", false);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
        Skip to main content
      </a>
      {!hideNav && <Navbar />}
      <motion.main id="main-content" {...pageTransition}>
        <LegalGlossaryProvider>
          {children}
        </LegalGlossaryProvider>
      </motion.main>
      {!hideFooter && <Footer phone={phone} email={email} copyrightText={copyrightText} />}
      <BackToTop />
      <MobileFAB />
      {!isInternalRoute && <AILeadChatbot />}
      {cookieConsentEnabled && <CookieConsent />}
      <OfflineIndicator />
    </div>
  );
}
