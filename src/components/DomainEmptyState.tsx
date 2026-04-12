/**
 * SVC-220: Helpful empty states with actions and tips
 * Domain-specific empty states for admin panels.
 */
import { EmptyState } from "@/components/EmptyState";

interface DomainEmptyStateConfig {
  icon: "appointments" | "documents" | "chat" | "search";
  title: string;
  description: string;
  actionLabel?: string;
  tip?: string;
}

const DOMAIN_EMPTY_STATES: Record<string, DomainEmptyStateConfig> = {
  appointments: {
    icon: "appointments",
    title: "No appointments yet",
    description: "Appointments will appear here once clients book through your services page or you create them manually.",
    actionLabel: "Create Appointment",
    tip: "Tip: Share your booking link to get started quickly.",
  },
  documents: {
    icon: "documents",
    title: "No documents uploaded",
    description: "Upload documents for notarization or have clients submit them through the booking flow.",
    actionLabel: "Upload Document",
  },
  clients: {
    icon: "search",
    title: "No clients registered",
    description: "Client profiles are created automatically when users sign up or book appointments.",
    tip: "Tip: Share your services page link to attract new clients.",
  },
  payments: {
    icon: "documents",
    title: "No payments recorded",
    description: "Payment records will appear here once clients complete transactions.",
  },
  orders: {
    icon: "documents",
    title: "No orders yet",
    description: "Orders are created when clients purchase services or products.",
  },
  messages: {
    icon: "chat",
    title: "No messages",
    description: "Messages from clients and team members will appear here.",
  },
  tasks: {
    icon: "search",
    title: "All caught up!",
    description: "No pending tasks at the moment. New tasks will appear when actions are needed.",
  },
};

interface DomainEmptyStateProps {
  domain: keyof typeof DOMAIN_EMPTY_STATES;
  onAction?: () => void;
  customActionLabel?: string;
}

export function DomainEmptyState({ domain, onAction, customActionLabel }: DomainEmptyStateProps) {
  const config = DOMAIN_EMPTY_STATES[domain];
  if (!config) return null;

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      actionLabel={customActionLabel || config.actionLabel}
      onAction={onAction}
    >
      {config.tip && (
        <p className="text-xs text-muted-foreground italic mt-2">{config.tip}</p>
      )}
    </EmptyState>
  );
}
