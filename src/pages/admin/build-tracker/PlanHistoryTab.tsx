import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertTriangle, Plus, Loader2 } from "lucide-react";
import type { TrackerPlan, PlanItem, TrackerItem } from "./constants";
import { usePlans, useUpdatePlan, useBulkInsert } from "./hooks";

type Props = {
  items: TrackerItem[];
};

export default function PlanHistoryTab({ items }: Props) {
  const { data: plans = [], isLoading } = usePlans();
  const updatePlan = useUpdatePlan();
  const bulkInsert = useBulkInsert();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const planStats = useMemo(() =>
    plans.map((p) => {
      const total = p.plan_items.length;
      const done = p.plan_items.filter((i) => i.status === "implemented").length;
      const partial = p.plan_items.filter((i) => i.status === "partial").length;
      return { ...p, total, done, partial, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    }),
    [plans]
  );

  const updateItemStatus = (planId: string, idx: number, status: PlanItem["status"]) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const updated = [...plan.plan_items];
    updated[idx] = { ...updated[idx], status };
    updatePlan.mutate({ id: planId, plan_items: updated });
  };

  const addUnfinishedToTodo = (plan: TrackerPlan) => {
    const pending = plan.plan_items.filter((i) => i.status !== "implemented");
    if (pending.length === 0) { toast.info("All items implemented"); return; }
    const newItems = pending.map((i) => ({
      title: `[Plan: ${plan.plan_title}] ${i.title}`,
      category: "gap",
      severity: "medium",
      status: "open",
      is_on_todo: true,
      plan_id: plan.id,
    }));
    bulkInsert.mutate(newItems as any[]);
  };

  const statusIcon = (s: string) => {
    if (s === "implemented") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (s === "partial") return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track all implementation plans and their completion status. Import plans from chat to monitor progress.
      </p>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium mb-1">No plans tracked yet</p>
            <p className="text-sm text-muted-foreground">Use the "Add / Import" tab to import a plan from chat.</p>
          </CardContent>
        </Card>
      ) : (
        planStats.map((plan) => (
          <Card key={plan.id}>
            <Collapsible open={expandedPlan === plan.id} onOpenChange={(o) => setExpandedPlan(o ? plan.id : null)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedPlan === plan.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <CardTitle className="text-base">{plan.plan_title}</CardTitle>
                        <CardDescription className="text-xs">
                          {plan.source === "chat" ? "From Chat" : "Manual"} · {new Date(plan.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-bold">{plan.pct}%</div>
                        <Progress value={plan.pct} className="h-1.5 w-20" />
                      </div>
                      <Badge variant="outline" className="text-xs">{plan.done}/{plan.total}</Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {plan.plan_summary && <p className="text-sm text-muted-foreground mb-3">{plan.plan_summary}</p>}
                  <div className="space-y-1">
                    {plan.plan_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        {statusIcon(item.status)}
                        <span className={`text-sm flex-1 ${item.status === "implemented" ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </span>
                        <Select value={item.status} onValueChange={(v) => updateItemStatus(plan.id, idx, v as PlanItem["status"])}>
                          <SelectTrigger className="h-6 text-[10px] w-auto min-w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="implemented">Implemented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => addUnfinishedToTodo(plan)} disabled={bulkInsert.isPending}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Unfinished to To-Do
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))
      )}
    </div>
  );
}
