/**
 * Sprint B (B-11..20): MFA enforcement gate.
 * Wraps sensitive routes (/ron-session, /admin/journal, financial routes).
 * Notaries and admins MUST have a verified TOTP factor and an active AAL2 session
 * to access these routes. If MFA is not set up, prompts to enroll.
 * If set up but session is AAL1, prompts for TOTP code.
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { checkMFAStatus, verifyMFACode, routeRequiresMFA } from "@/lib/mfaEnforcement";
import { useToast } from "@/hooks/use-toast";

interface MFAGateProps {
  children: React.ReactNode;
  /** Override the route-based check and always require MFA. */
  alwaysRequire?: boolean;
}

export default function MFAGate({ children, alwaysRequire = false }: MFAGateProps) {
  const { isAdmin, isNotary, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<{ enabled: boolean; verified: boolean; factorId?: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [checking, setChecking] = useState(true);

  // Only enforce on staff (admin/notary) for sensitive routes
  const requireForRoute = alwaysRequire || routeRequiresMFA(location.pathname);
  const isPrivilegedUser = isAdmin || isNotary;
  const shouldEnforce = requireForRoute && isPrivilegedUser && !!user;

  useEffect(() => {
    if (!shouldEnforce) {
      setChecking(false);
      return;
    }
    let mounted = true;
    checkMFAStatus()
      .then((s) => {
        if (mounted) {
          setStatus(s);
          setChecking(false);
        }
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [shouldEnforce, location.pathname]);

  if (!shouldEnforce || checking) {
    if (checking && shouldEnforce) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return <>{children}</>;
  }

  if (status?.verified) return <>{children}</>;

  const handleVerify = async () => {
    if (!status?.factorId || !code.trim()) return;
    setVerifying(true);
    const ok = await verifyMFACode(status.factorId, code.trim());
    if (ok) {
      toast({ title: "MFA verified", description: "You now have full access." });
      setStatus({ ...status, verified: true });
    } else {
      toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
    }
    setVerifying(false);
    setCode("");
  };

  // MFA not enrolled
  if (!status?.enabled) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Alert className="max-w-lg border-destructive/30 bg-destructive/5">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-destructive">Multi-Factor Authentication Required</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              This area handles sensitive notary records and requires MFA. You must enroll a TOTP authenticator
              (Google Authenticator, Authy, 1Password) before continuing.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/account-settings?tab=security")} variant="default" size="sm">
                Set Up MFA
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline" size="sm">
                Go Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // MFA enrolled but session is AAL1 — prompt for code
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Verify Your Identity</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to access this protected area.
        </p>
        <div className="space-y-3">
          <Label htmlFor="mfa-code">Authenticator Code</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="123456"
            autoFocus
          />
          <Button onClick={handleVerify} disabled={verifying || code.length !== 6} className="w-full">
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
