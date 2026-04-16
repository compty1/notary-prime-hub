import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import EmailVerificationGate from "@/components/EmailVerificationGate";
import MFAGate from "@/components/MFAGate";
import { routeRequiresMFA } from "@/lib/mfaEnforcement";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** If true, only admin role is allowed (not notary). Use for sensitive admin pages like Users, Settings, Revenue. */
  adminOnly?: boolean;
  /** Sprint B (B-01..10): Block access until the user verifies their email. */
  requireVerifiedEmail?: boolean;
  /** Sprint B (B-11..20): Force MFA challenge regardless of route-based detection. */
  requireMFA?: boolean;
  /** Friendly action label shown in the email-verification gate. */
  gateAction?: string;
}

const AUTH_TIMEOUT_MS = 15000;

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  adminOnly = false,
  requireVerifiedEmail = false,
  requireMFA = false,
  gateAction,
}: ProtectedRouteProps) => {
  const { user, isAdmin, isNotary, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  // RT-005: Build login redirect with returnUrl
  const loginRedirect = `/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`;

  if (loading && !timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verifying credentials…</p>
      </div>
    );
  }

  if (timedOut && !user) {
    return <Navigate to={loginRedirect} replace />;
  }

  if (!user) return <Navigate to={loginRedirect} replace />;

  const emailConfirmed = user.email_confirmed_at || user.confirmed_at;

  // Admin-only routes: restrict to admin role only
  if (adminOnly && !isAdmin) return <Navigate to="/portal" replace />;

  // Allow both admin and notary roles to access admin dashboard
  if (requireAdmin && !isAdmin && !isNotary) return <Navigate to="/portal" replace />;

  // Sprint B: layered gates — MFA wraps email gate wraps content
  let content: React.ReactNode = children;

  if (requireVerifiedEmail) {
    content = <EmailVerificationGate action={gateAction}>{content}</EmailVerificationGate>;
  }

  // Auto-detect MFA requirement based on route OR honor explicit prop
  if (requireMFA || routeRequiresMFA(location.pathname)) {
    content = <MFAGate alwaysRequire={requireMFA}>{content}</MFAGate>;
  }

  return (
    <>
      {!emailConfirmed && !requireVerifiedEmail && (
        <Alert className="mx-auto mt-2 max-w-3xl border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
            Your email is not verified. Please check your inbox for a verification link to access all features.
          </AlertDescription>
        </Alert>
      )}
      {content}
    </>
  );
};

export default ProtectedRoute;
