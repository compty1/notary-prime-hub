/**
 * EmptyState — reusable accessible empty-state block.
 *
 * Standardizes the "no data" pattern across admin dashboards and portal
 * tabs: icon, headline, helper text, and an optional CTA. WCAG-friendly:
 * decorative icon is `aria-hidden`, headline is a real heading.
 */
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, children, className = "" }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card px-6 py-12 text-center ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="mb-4 h-12 w-12 text-muted-foreground/50" />}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-4">
          {action.label}
        </Button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
