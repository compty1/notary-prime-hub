import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
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
  // Allow both admin and notary roles to access admin dashboard
  if (requireAdmin && !isAdmin && !isNotary) return <Navigate to="/portal" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
