/**
 * UI-001: Page-level error boundary wrapper that adds breadcrumbs context
 * and consistent layout around ErrorBoundary.
 */
import ErrorBoundary from "@/components/ErrorBoundary";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { ReactNode } from "react";

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary fallbackMessage={pageName ? `Error loading ${pageName}` : undefined}>
      {children}
    </ErrorBoundary>
  );
}
