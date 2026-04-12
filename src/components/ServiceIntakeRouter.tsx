/**
 * B-001+: Routes users to the correct intake experience based on service flow config.
 * Used on service detail pages and booking flows to ensure each service
 * uses its proper intake procedure (book, request, subscribe, portal, custom).
 */
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, CreditCard, ExternalLink } from "lucide-react";
import { getServiceFlow, type ServiceFlowConfig } from "@/lib/serviceFlowConfig";
import { getServiceById } from "@/lib/serviceRegistry";
import { formatDuration } from "@/lib/serviceDurationEngine";

interface ServiceIntakeRouterProps {
  serviceId: string;
  serviceName?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const ROUTE_LABELS: Record<string, { label: string; icon: typeof Calendar }> = {
  book: { label: "Book Appointment", icon: Calendar },
  request: { label: "Request Service", icon: FileText },
  subscribe: { label: "Subscribe", icon: CreditCard },
  portal: { label: "Access in Portal", icon: ExternalLink },
  custom: { label: "Get Started", icon: Calendar },
};

export function ServiceIntakeRouter({
  serviceId,
  serviceName,
  className,
  variant = "default",
  size = "default",
}: ServiceIntakeRouterProps) {
  const navigate = useNavigate();
  const flow = getServiceFlow(serviceId);
  const service = getServiceById(serviceId);

  if (!flow || !service) return null;

  const route = flow.intakeRoute === "custom" && flow.customPath
    ? flow.customPath
    : `/${flow.intakeRoute}`;

  const routeConfig = ROUTE_LABELS[flow.intakeRoute] || ROUTE_LABELS.book;
  const Icon = routeConfig.icon;
  const duration = service.estimatedDuration;

  const handleClick = () => {
    const params = new URLSearchParams();
    params.set("service", serviceId);
    if (serviceName) params.set("name", serviceName);
    navigate(`${route}?${params.toString()}`);
  };

  return (
    <div className={className}>
      <Button onClick={handleClick} variant={variant} size={size} className="gap-2">
        <Icon className="h-4 w-4" />
        {routeConfig.label}
      </Button>
      {duration && duration > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Est. {formatDuration(duration)} • {flow.turnaroundTime}
        </p>
      )}
    </div>
  );
}
