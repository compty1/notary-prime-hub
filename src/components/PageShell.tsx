import { ReactNode, useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { MobileFAB } from "@/components/MobileFAB";
import { AILeadChatbot } from "@/components/AILeadChatbot";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

// Simple in-memory cache for platform_settings across PageShell mounts (item 531)
let _cachedContact: { phone: string; email: string } | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PageShellProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function PageShell({ children, hideNav = false, hideFooter = false }: PageShellProps) {
  const [contactInfo, setContactInfo] = useState(_cachedContact || { phone: "(614) 300-6890", email: "contact@notardex.com" });

  useEffect(() => {
    if (_cachedContact && Date.now() - _cacheTime < CACHE_TTL) {
      setContactInfo(_cachedContact);
      return;
    }
    supabase.from("platform_settings").select("setting_key, setting_value")
      .in("setting_key", ["notary_phone", "notary_email"])
      .then(({ data }) => {
        if (data) {
          const phone = data.find(s => s.setting_key === "notary_phone")?.setting_value;
          const email = data.find(s => s.setting_key === "notary_email")?.setting_value;
          const info = {
            phone: phone || contactInfo.phone,
            email: email || contactInfo.email,
          };
          setContactInfo(info);
          _cachedContact = info;
          _cacheTime = Date.now();
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
      <OfflineIndicator />
    </div>
  );
}
