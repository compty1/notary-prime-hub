import { ReactNode } from "react";
import { FileText, Calendar, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: "documents" | "appointments" | "chat" | "search";
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  children?: ReactNode;
}

const iconMap = {
  documents: FileText,
  appointments: Calendar,
  chat: MessageSquare,
  search: Search,
};

export function EmptyState({ icon = "documents", title, description, actionLabel, actionTo, onAction, children }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
      {children}
    </div>
  );
}
