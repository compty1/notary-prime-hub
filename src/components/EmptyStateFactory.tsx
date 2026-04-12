/**
 * C-091+: Standardized empty states for all data tables and lists.
 * Provides contextual empty states with icons, messaging, and optional CTAs.
 */
import { Button } from "@/components/ui/button";
import { 
  Calendar, FileText, Users, Mail, Bell, CreditCard, 
  Search, Inbox, ClipboardList, FolderOpen, MessageSquare,
  type LucideIcon
} from "lucide-react";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

const EMPTY_STATES: Record<string, EmptyStateConfig> = {
  appointments: {
    icon: Calendar,
    title: "No appointments yet",
    description: "Your upcoming appointments will appear here once scheduled.",
    actionLabel: "Book an Appointment",
    actionHref: "/book",
  },
  documents: {
    icon: FileText,
    title: "No documents uploaded",
    description: "Upload documents to get started with your notarization or service request.",
    actionLabel: "Upload Document",
  },
  clients: {
    icon: Users,
    title: "No clients found",
    description: "Client records will appear here as bookings come in.",
  },
  emails: {
    icon: Mail,
    title: "No emails",
    description: "Your email correspondence will appear here.",
  },
  notifications: {
    icon: Bell,
    title: "All caught up!",
    description: "You have no new notifications.",
  },
  invoices: {
    icon: CreditCard,
    title: "No invoices",
    description: "Invoices will appear here after completed services.",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
  },
  messages: {
    icon: MessageSquare,
    title: "No messages yet",
    description: "Start a conversation with your notary or service provider.",
  },
  journal: {
    icon: ClipboardList,
    title: "No journal entries",
    description: "Notarial acts will be recorded here automatically.",
  },
  files: {
    icon: FolderOpen,
    title: "No files",
    description: "Files and attachments will appear here.",
  },
  default: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "Data will appear here once available.",
  },
};

interface EmptyStateFactoryProps {
  type: keyof typeof EMPTY_STATES | string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateFactory({ type, onAction, className = "" }: EmptyStateFactoryProps) {
  const config = EMPTY_STATES[type] || EMPTY_STATES.default;
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{config.description}</p>
      {config.actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline">
          {config.actionLabel}
        </Button>
      )}
      {config.actionLabel && config.actionHref && !onAction && (
        <Button asChild size="sm" variant="outline">
          <a href={config.actionHref}>{config.actionLabel}</a>
        </Button>
      )}
    </div>
  );
}
