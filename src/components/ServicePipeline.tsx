import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

export type PipelineStage = {
  id: string;
  label: string;
  count: number;
  color: string;
};

interface ServicePipelineProps {
  stages: PipelineStage[];
  title?: string;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: "inquiry", label: "Inquiry", count: 0, color: "bg-blue-500" },
  { id: "scheduled", label: "Scheduled", count: 0, color: "bg-yellow-500" },
  { id: "in_progress", label: "In Progress", count: 0, color: "bg-orange-500" },
  { id: "completed", label: "Completed", count: 0, color: "bg-green-500" },
  { id: "cancelled", label: "Cancelled", count: 0, color: "bg-red-500" },
];

export function ServicePipeline({ stages = DEFAULT_STAGES, title = "Service Pipeline" }: ServicePipelineProps) {
  const total = useMemo(() => stages.reduce((sum, s) => sum + s.count, 0), [stages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-[10px]">{total} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual bar */}
        {total > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {stages.filter(s => s.count > 0).map(stage => (
              <div
                key={stage.id}
                className={`${stage.color} transition-all`}
                style={{ width: `${(stage.count / total) * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Stage list */}
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="text-xs text-muted-foreground">{stage.label}</span>
              <span className="text-xs font-semibold">{stage.count}</span>
              {i < stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
