import { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const COOKIE_KEY = "cookie_consent_accepted";

const CookieConsentInner = forwardRef<HTMLDivElement>((_, ref) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = safeGetItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    safeSetItem(COOKIE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div ref={ref}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        role="alertdialog"
        aria-label="Cookie consent"
        aria-describedby="cookie-consent-desc"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg"
      >
        <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p id="cookie-consent-desc" className="text-sm text-muted-foreground">
              We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our{" "}
              <Link to="/terms" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={accept}>
              Accept All
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              safeSetItem(COOKIE_KEY, "essential-only");
              setVisible(false);
            }}>
              Essential Only
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
CookieConsentInner.displayName = "CookieConsentInner";

export function CookieConsent() {
  return (
    <AnimatePresence>
      <CookieConsentInner />
    </AnimatePresence>
  );
}
