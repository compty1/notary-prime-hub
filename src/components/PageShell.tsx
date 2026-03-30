import { ReactNode, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

interface PageShellProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function PageShell({ children, hideNav = false, hideFooter = false }: PageShellProps) {
  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "contact@notardex.com" });

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value")
      .in("setting_key", ["notary_phone", "notary_email"])
      .then(({ data }) => {
        if (data) {
          const phone = data.find(s => s.setting_key === "notary_phone")?.setting_value;
          const email = data.find(s => s.setting_key === "notary_email")?.setting_value;
          if (phone) setContactInfo(prev => ({ ...prev, phone }));
          if (email) setContactInfo(prev => ({ ...prev, email }));
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
        Skip to main content
      </a>
      {!hideNav && <Navbar />}
      <motion.main id="main-content" {...pageTransition}>
        {children}
      </motion.main>
      {!hideFooter && <Footer phone={contactInfo.phone} email={contactInfo.email} />}
      <BackToTop />
      <CookieConsent />
    </div>
  );
}
