/**
 * SVC-221: Improved error page with recovery actions and request ID
 */
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorPageProps {
  title?: string;
  message?: string;
  requestId?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
}

export function ErrorPage({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again or contact support.",
  requestId,
  showRetry = true,
  showHome = true,
  showBack = true,
  onRetry,
}: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {requestId && (
        <p className="text-xs font-mono text-muted-foreground mb-4 bg-muted px-3 py-1 rounded">
          Request ID: {requestId}
        </p>
      )}
      <div className="flex gap-3">
        {showBack && (
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Go Back
          </Button>
        )}
        {showRetry && (
          <Button variant="outline" size="sm" onClick={onRetry || (() => window.location.reload())}>
            <RefreshCw className="h-4 w-4 mr-1" /> Try Again
          </Button>
        )}
        {showHome && (
          <Button size="sm" onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
        )}
      </div>
    </div>
  );
}
