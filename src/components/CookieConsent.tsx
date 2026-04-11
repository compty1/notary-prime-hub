import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings } from "lucide-react";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const COOKIE_KEY = "cookie_consent_accepted";
const COOKIE_PREFS_KEY = "cookie_preferences";

interface CookiePrefs {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePrefs = { essential: true, analytics: false, marketing: false };

const CookieConsentInner = () => {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(() => {
    try { return JSON.parse(safeGetItem(COOKIE_PREFS_KEY) || "null") || DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
  });

  useEffect(() => {
    const accepted = safeGetItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePrefs = (p: CookiePrefs) => {
    safeSetItem(COOKIE_PREFS_KEY, JSON.stringify(p));
    safeSetItem(COOKIE_KEY, "custom");
    setVisible(false);
  };

  const acceptAll = () => {
    const all: CookiePrefs = { essential: true, analytics: true, marketing: true };
    setPrefs(all);
    savePrefs(all);
  };

  const essentialOnly = () => {
    const ess: CookiePrefs = { essential: true, analytics: false, marketing: false };
    setPrefs(ess);
    savePrefs(ess);
  };

  if (!visible) return null;

  return (
    <div>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        role="alertdialog"
        aria-label="Cookie consent"
        aria-describedby="cookie-consent-desc"
        className="fixed bottom-0 left-0 right-0 z-[45] border-t border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg"
      >
        <div className="container mx-auto space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p id="cookie-consent-desc" className="text-sm text-muted-foreground">
                We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our{" "}
                <Link to="/terms" className="text-primary underline hover:text-primary/80">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={acceptAll}>Accept All</Button>
              <Button size="sm" variant="outline" onClick={essentialOnly}>Essential Only</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowPrefs(!showPrefs)} aria-label="Cookie preferences">
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setVisible(false)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* #3437: Granular cookie preference controls */}
          {showPrefs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
            >
              <p className="text-sm font-medium text-foreground">Cookie Preferences</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Essential Cookies</p>
                    <p className="text-xs text-muted-foreground">Required for basic site functionality. Cannot be disabled.</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Analytics Cookies</p>
                    <p className="text-xs text-muted-foreground">Help us understand how you use our site to improve it.</p>
                  </div>
                  <Switch checked={prefs.analytics} onCheckedChange={v => setPrefs(p => ({ ...p, analytics: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Marketing Cookies</p>
                    <p className="text-xs text-muted-foreground">Used to show relevant content and measure campaign effectiveness.</p>
                  </div>
                  <Switch checked={prefs.marketing} onCheckedChange={v => setPrefs(p => ({ ...p, marketing: v }))} />
                </div>
              </div>
              <Button size="sm" onClick={() => savePrefs(prefs)}>Save Preferences</Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export function CookieConsent() {
  return (
    <AnimatePresence>
      <CookieConsentInner />
    </AnimatePresence>
  );
}
