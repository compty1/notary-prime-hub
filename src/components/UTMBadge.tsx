import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe } from "lucide-react";

interface UTMBadgeProps {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
}

export function UTMBadge({ source, medium, campaign }: UTMBadgeProps) {
  if (!source && !medium && !campaign) return null;

  const label = source || medium || campaign || "Referral";

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="text-xs gap-1">
          <Globe className="h-2.5 w-2.5" /> {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-0.5">
          {source && <p>Source: {source}</p>}
          {medium && <p>Medium: {medium}</p>}
          {campaign && <p>Campaign: {campaign}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
