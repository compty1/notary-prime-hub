import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInHours, parseISO } from "date-fns";

type SLAItem = {
  id: string;
  label: string;
  createdAt: string;
  resolvedAt?: string | null;
  targetHours: number;
};

interface SLATrackerProps {
  items: SLAItem[];
}

export function SLATracker({ items }: SLATrackerProps) {
  const stats = useMemo(() => {
    let met = 0;
    let breached = 0;
    let atRisk = 0;
    const now = new Date();

    items.forEach(item => {
      const elapsed = differenceInHours(
        item.resolvedAt ? parseISO(item.resolvedAt) : now,
        parseISO(item.createdAt)
      );
      const pct = (elapsed / item.targetHours) * 100;

      if (item.resolvedAt && pct <= 100) met++;
      else if (pct > 100) breached++;
      else if (pct > 80) atRisk++;
      else met++;
    });

    return { met, breached, atRisk, total: items.length };
  }, [items]);

  const complianceRate = stats.total > 0 ? Math.round((stats.met / stats.total) * 100) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4" /> SLA Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{complianceRate}%</span>
          <Badge variant={complianceRate >= 95 ? "default" : complianceRate >= 80 ? "secondary" : "destructive"}>
            {complianceRate >= 95 ? "Excellent" : complianceRate >= 80 ? "Acceptable" : "Needs Attention"}
          </Badge>
        </div>
        <Progress value={complianceRate} className="h-2" />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-success/10">
            <CheckCircle2 className="h-4 w-4 mx-auto text-success mb-1" />
            <div className="text-lg font-semibold text-success">{stats.met}</div>
            <div className="text-[10px] text-muted-foreground">Met</div>
          </div>
          <div className="p-2 rounded-md bg-warning/10">
            <AlertTriangle className="h-4 w-4 mx-auto text-warning mb-1" />
            <div className="text-lg font-semibold text-warning">{stats.atRisk}</div>
            <div className="text-[10px] text-muted-foreground">At Risk</div>
          </div>
          <div className="p-2 rounded-md bg-destructive/10">
            <AlertTriangle className="h-4 w-4 mx-auto text-destructive mb-1" />
            <div className="text-lg font-semibold text-destructive">{stats.breached}</div>
            <div className="text-[10px] text-muted-foreground">Breached</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
