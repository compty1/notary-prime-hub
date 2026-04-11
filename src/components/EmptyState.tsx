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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 border border-border">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
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
