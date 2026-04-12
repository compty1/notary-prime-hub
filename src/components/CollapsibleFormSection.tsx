/**
 * SVC-247: Progressive disclosure for complex forms
 * Collapsible form sections that expand on demand.
 */
import { useState, ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function CollapsibleFormSection({ title, description, defaultOpen = false, badge, children, className }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("rounded-lg border border-border", className)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div className="text-left">
            <p className="text-sm font-medium">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{badge}</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border mt-0 pt-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
