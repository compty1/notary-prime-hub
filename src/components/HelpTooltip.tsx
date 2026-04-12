/**
 * SVC-250: Contextual help tooltips
 * Wraps content with an info icon that shows a help tooltip.
 */
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function HelpTooltip({ content, side = "top", className }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex text-muted-foreground hover:text-foreground transition-colors ${className || ""}`} aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** Label with inline help tooltip */
export function LabelWithHelp({ label, help, htmlFor }: { label: string; help: string; htmlFor?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      <HelpTooltip content={help} />
    </div>
  );
}
