/**
 * BTN-003 / SVC-463: Service requirement badges and tags
 * Renders visual indicators like "Remote Available", "ID Required", "Same-Day"
 */
import { Badge } from "@/components/ui/badge";
import { Monitor, Shield, Zap, MapPin, Globe, Star } from "lucide-react";
import type { ServiceTag } from "@/lib/serviceRegistry";

const TAG_CONFIG: Record<ServiceTag, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  "remote": { label: "Remote Available", icon: Monitor, variant: "default" },
  "in-person": { label: "In-Person", icon: MapPin, variant: "secondary" },
  "same-day": { label: "Same-Day", icon: Zap, variant: "default" },
  "id-required": { label: "ID Required", icon: Shield, variant: "outline" },
  "notary-required": { label: "Notary Required", icon: Shield, variant: "outline" },
  "ohio-only": { label: "Ohio Only", icon: Globe, variant: "secondary" },
  "nationwide": { label: "Nationwide", icon: Globe, variant: "default" },
  "rush-available": { label: "Rush Available", icon: Zap, variant: "secondary" },
  "subscription": { label: "Subscription", icon: Star, variant: "outline" },
  "free-tier": { label: "Free Tier", icon: Star, variant: "default" },
};

interface ServiceBadgesProps {
  tags: ServiceTag[];
  maxVisible?: number;
  size?: "sm" | "default";
}

export function ServiceBadges({ tags, maxVisible = 3, size = "sm" }: ServiceBadgesProps) {
  const visible = tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(tag => {
        const config = TAG_CONFIG[tag];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <Badge
            key={tag}
            variant={config.variant}
            className={size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "gap-1"}
          >
            <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {config.label}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className={size === "sm" ? "text-[10px] px-1.5 py-0" : ""}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
