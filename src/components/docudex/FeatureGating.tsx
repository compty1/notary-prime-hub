/**
 * P7-001: Feature gating — Free/Pro/Business/Enterprise tiers
 * P7-002: Product analytics tracking
 */
import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Sparkles, Building2, Rocket } from "lucide-react";
import { useState } from "react";

export type EditorTier = "free" | "pro" | "business" | "enterprise";

interface TierLimits {
  maxPages: number;
  maxElementsPerPage: number;
  maxTemplates: number;
  canExportPDF: boolean;
  canExportSVG: boolean;
  canCollaborate: boolean;
  canUseAI: boolean;
  canBrandKit: boolean;
  canMailMerge: boolean;
  canVersionHistory: boolean;
  canComments: boolean;
  canApprovalWorkflow: boolean;
  canWhiteLabel: boolean;
  maxStorageMB: number;
}

const TIER_LIMITS: Record<EditorTier, TierLimits> = {
  free: {
    maxPages: 5,
    maxElementsPerPage: 20,
    maxTemplates: 10,
    canExportPDF: true,
    canExportSVG: false,
    canCollaborate: false,
    canUseAI: false,
    canBrandKit: false,
    canMailMerge: false,
    canVersionHistory: false,
    canComments: false,
    canApprovalWorkflow: false,
    canWhiteLabel: false,
    maxStorageMB: 50,
  },
  pro: {
    maxPages: 50,
    maxElementsPerPage: 100,
    maxTemplates: 100,
    canExportPDF: true,
    canExportSVG: true,
    canCollaborate: true,
    canUseAI: true,
    canBrandKit: true,
    canMailMerge: false,
    canVersionHistory: true,
    canComments: true,
    canApprovalWorkflow: false,
    canWhiteLabel: false,
    maxStorageMB: 500,
  },
  business: {
    maxPages: 200,
    maxElementsPerPage: 500,
    maxTemplates: 1000,
    canExportPDF: true,
    canExportSVG: true,
    canCollaborate: true,
    canUseAI: true,
    canBrandKit: true,
    canMailMerge: true,
    canVersionHistory: true,
    canComments: true,
    canApprovalWorkflow: true,
    canWhiteLabel: false,
    maxStorageMB: 5000,
  },
  enterprise: {
    maxPages: Infinity,
    maxElementsPerPage: Infinity,
    maxTemplates: Infinity,
    canExportPDF: true,
    canExportSVG: true,
    canCollaborate: true,
    canUseAI: true,
    canBrandKit: true,
    canMailMerge: true,
    canVersionHistory: true,
    canComments: true,
    canApprovalWorkflow: true,
    canWhiteLabel: true,
    maxStorageMB: Infinity,
  },
};

interface FeatureGateContextType {
  tier: EditorTier;
  limits: TierLimits;
  canAccess: (feature: keyof TierLimits) => boolean;
  requireFeature: (feature: keyof TierLimits) => boolean;
  trackEvent: (event: string, properties?: Record<string, any>) => void;
}

const FeatureGateContext = createContext<FeatureGateContextType>({
  tier: "free",
  limits: TIER_LIMITS.free,
  canAccess: () => true,
  requireFeature: () => true,
  trackEvent: () => {},
});

export function useFeatureGate() {
  return useContext(FeatureGateContext);
}

interface FeatureGateProviderProps {
  tier?: EditorTier;
  children: ReactNode;
}

export function FeatureGateProvider({ tier = "pro", children }: FeatureGateProviderProps) {
  const { user } = useAuth();
  const [upgradeDialog, setUpgradeDialog] = useState<string | null>(null);
  const limits = TIER_LIMITS[tier];

  const canAccess = useCallback((feature: keyof TierLimits) => {
    const val = limits[feature];
    return typeof val === "boolean" ? val : typeof val === "number" ? val > 0 : true;
  }, [limits]);

  const requireFeature = useCallback((feature: keyof TierLimits): boolean => {
    if (canAccess(feature)) return true;
    setUpgradeDialog(feature);
    return false;
  }, [canAccess]);

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    // Analytics event tracking
    const payload = {
      event,
      userId: user?.id,
      tier,
      timestamp: new Date().toISOString(),
      ...properties,
    };
    // Store in sessionStorage for batch sending
    try {
      const existing = JSON.parse(sessionStorage.getItem("docudex_analytics") || "[]");
      existing.push(payload);
      if (existing.length > 100) existing.shift(); // Keep last 100
      sessionStorage.setItem("docudex_analytics", JSON.stringify(existing));
    } catch { /* storage full */ }
    // Console in dev
    if (import.meta.env.DEV) {
      console.log("[DocuDex Analytics]", event, properties);
    }
  }, [user?.id, tier]);

  const value = useMemo(() => ({
    tier, limits, canAccess, requireFeature, trackEvent,
  }), [tier, limits, canAccess, requireFeature, trackEvent]);

  const tierIcon = {
    free: null,
    pro: <Crown className="w-5 h-5 text-primary" />,
    business: <Building2 className="w-5 h-5 text-primary" />,
    enterprise: <Rocket className="w-5 h-5 text-primary" />,
  };

  return (
    <FeatureGateContext.Provider value={value}>
      {children}
      <Dialog open={!!upgradeDialog} onOpenChange={() => setUpgradeDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Upgrade Required
            </DialogTitle>
            <DialogDescription>
              This feature requires a higher plan. Upgrade to unlock all DocuDex capabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {(["pro", "business", "enterprise"] as EditorTier[])
              .filter(t => TIER_LIMITS[t][upgradeDialog as keyof TierLimits])
              .slice(0, 2)
              .map(t => (
                <div key={t} className="p-3 border border-border rounded-xl text-center space-y-2">
                  {tierIcon[t]}
                  <p className="text-sm font-semibold capitalize">{t}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {t === "pro" ? "$19/mo" : t === "business" ? "$49/mo" : "Custom"}
                  </Badge>
                  <Button size="sm" className="w-full mt-2" variant={t === "pro" ? "default" : "outline"}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Upgrade
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </FeatureGateContext.Provider>
  );
}

/** Gate wrapper component — hides children if feature not available */
export function FeatureGate({ feature, children, fallback }: {
  feature: keyof TierLimits;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canAccess } = useFeatureGate();
  if (!canAccess(feature)) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}
