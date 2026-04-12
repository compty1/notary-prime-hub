/**
 * B-051: Service flow steps component for service detail pages.
 * Shows the step-by-step process for a service.
 */
import { getServiceFlow } from "@/lib/serviceFlowConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface ServiceFlowStepsProps {
  serviceId: string;
}

export function ServiceFlowSteps({ serviceId }: ServiceFlowStepsProps) {
  const flow = getServiceFlow(serviceId);
  if (!flow || flow.steps.length === 0) return null;

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">How It Works</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {flow.turnaroundTime}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              {/* Vertical line */}
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                {i < flow.steps.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  {step.required && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
