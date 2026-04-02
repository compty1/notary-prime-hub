import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** If true, only admin role is allowed (not notary). Use for sensitive admin pages like Users, Settings, Revenue. */
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAdmin, isNotary, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verifying credentials…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Email verification reminder (non-blocking)
  const emailConfirmed = user.email_confirmed_at || user.confirmed_at;

  // Allow both admin and notary roles to access admin dashboard
  if (requireAdmin && !isAdmin && !isNotary) return <Navigate to="/portal" replace />;

  return (
    <>
      {!emailConfirmed && (
        <Alert className="mx-auto mt-2 max-w-3xl border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
            Your email is not verified. Please check your inbox for a verification link to access all features.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
