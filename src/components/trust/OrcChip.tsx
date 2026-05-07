import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrcChipProps {
  code: string;
  label?: string;
  description?: string;
  className?: string;
}

/**
 * OrcChip — inline statutory citation chip linking to Ohio Revised Code.
 * Use anywhere a legal claim is made (RON pages, FAQs, certificates).
 */
export function OrcChip({ code, label, description, className }: OrcChipProps) {
  const cleaned = code.replace(/^§\s*/, "");
  const url = `https://codes.ohio.gov/ohio-revised-code/section-${cleaned.replace(/\./g, "-")}`;
  const chip = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-[7px] border border-foreground/15 bg-accent/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/90 transition-colors hover:bg-accent",
        className,
      )}
      aria-label={`Ohio Revised Code ${code}${label ? ` — ${label}` : ""}`}
    >
      <Scale className="h-3 w-3" aria-hidden />
      <span>ORC §{cleaned}</span>
      {label && <span className="font-normal text-foreground/70">· {label}</span>}
    </a>
  );
  if (!description) return chip;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{description}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
