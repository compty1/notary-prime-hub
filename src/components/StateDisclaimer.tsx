import { Info } from "lucide-react";
import { getStateRules } from "@/lib/stateRules";

interface StateDisclaimerProps {
  state: string;
  serviceType?: string;
}

export function StateDisclaimer({ state, serviceType }: StateDisclaimerProps) {
  const rules = getStateRules(state);
  if (!rules) return null;

  const disclaimers = rules.disclaimers || [];
  if (disclaimers.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
      <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
        <Info className="h-3.5 w-3.5" /> {state} Legal Notice
      </div>
      {disclaimers.map((d: string, i: number) => (
        <p key={i}>• {d}</p>
      ))}
    </div>
  );
}
