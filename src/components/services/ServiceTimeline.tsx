import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export interface TimelineStep {
  step: number;
  label: string;
  description: string;
}

interface ServiceTimelineProps {
  steps: TimelineStep[];
  turnaround?: string;
  title?: string;
}

export function ServiceTimeline({ steps, turnaround, title = "What to Expect" }: ServiceTimelineProps) {
  if (!steps.length) return null;
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ol className="relative border-l border-muted ml-2 space-y-4">
          {steps.map((s) => (
            <li key={s.step} className="ml-4">
              <div className="absolute -left-2 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </li>
          ))}
        </ol>
        {turnaround && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3.5 w-3.5" />
            <span>Turnaround: {turnaround}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
