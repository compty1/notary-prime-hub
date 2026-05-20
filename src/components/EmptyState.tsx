/**
 * EmptyState — reusable accessible empty-state block.
 *
 * Accepts either a LucideIcon component OR a string key from the
 * domain icon map (appointments/documents/chat/search/inbox/generic)
 * for backward compatibility with existing call sites.
 */
import { ReactNode } from "react";
import { Calendar, FileText, MessageSquare, Search, Inbox, FolderOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ICON_MAP: Record<string, LucideIcon> = {
  appointments: Calendar,
  documents: FileText,
  chat: MessageSquare,
  search: Search,
  inbox: Inbox,
  generic: FolderOpen,
};

type IconProp = LucideIcon | keyof typeof ICON_MAP | string;

interface EmptyStateProps {
  icon?: IconProp;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  /** Legacy: actionLabel + onAction. */
  actionLabel?: string;
  onAction?: () => void;
  /** Legacy: link target — renders action as a router link. */
  actionTo?: string;
  children?: ReactNode;
  className?: string;
}

function resolveIcon(icon?: IconProp): LucideIcon | null {
  if (!icon) return null;
  if (typeof icon === "string") return ICON_MAP[icon] || FolderOpen;
  return icon;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  children,
  className = "",
}: EmptyStateProps) {
  const Icon = resolveIcon(icon);
  const effectiveAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null);

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card px-6 py-12 text-center ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="mb-4 h-12 w-12 text-muted-foreground/50" />}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {effectiveAction && (
        <Button onClick={effectiveAction.onClick} size="sm" className="mt-4">
          {effectiveAction.label}
        </Button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
