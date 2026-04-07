import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    try {
      supabase.from("audit_log").insert({
        action: "client_error",
        entity_type: "error_boundary",
        details: {
          message: error.message,
          stack: error.stack?.slice(0, 500),
          componentStack: errorInfo.componentStack?.slice(0, 500),
        },
      }).then(() => {});
    } catch {
      // Never throw from error reporting
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Failed to fetch");

      return (
        <div className="flex items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h2 className="mb-2 font-sans text-xl font-bold text-foreground">
              {this.props.fallbackMessage || "Something went wrong"}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
              {isChunkError
                ? "The page failed to load. This may be due to a poor network connection."
                : this.state.error?.message || "An unexpected error occurred."}
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              {isChunkError
                ? "Try refreshing the page. If the problem persists, check your internet connection."
                : "You can try again or navigate to the home page. If this keeps happening, please contact support."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onReset?.();
                }}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button
                onClick={() => { window.location.href = "/"; }}
                variant="default"
                className="gap-2"
              >
                <Home className="h-4 w-4" /> Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
