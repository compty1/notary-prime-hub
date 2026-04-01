import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertTriangle, Plus, Loader2, Upload } from "lucide-react";
import type { TrackerPlan, PlanItem, TrackerItem } from "./constants";
import { autoCategorize } from "./constants";
import { usePlans, useUpdatePlan, useBulkInsert, useInsertPlan } from "./hooks";

type Props = {
  items: TrackerItem[];
};

function parsePlanText(text: string): PlanItem[] {
  const lines = text.split("\n").filter(l => l.trim());
  const planItems: PlanItem[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[\s\-\*•]+/, "").replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim();
    if (cleaned.length > 3 && cleaned.length < 300) {
      planItems.push({ title: cleaned, status: "pending" });
    }
  }
  return planItems;
}

function crossReferenceItems(planItems: PlanItem[], trackerItems: TrackerItem[]): PlanItem[] {
  return planItems.map(pi => {
    const titleLower = pi.title.toLowerCase();
    const match = trackerItems.find(ti =>
      ti.title.toLowerCase().includes(titleLower.slice(0, 20)) ||
      titleLower.includes(ti.title.toLowerCase().slice(0, 20))
    );
    if (match) {
      if (match.status === "resolved") return { ...pi, status: "implemented" as const, tracker_item_id: match.id };
      if (match.status === "in_progress") return { ...pi, status: "partial" as const, tracker_item_id: match.id };
    }
    return pi;
  });
}

export default function PlanHistoryTab({ items }: Props) {
  const { data: plans = [], isLoading } = usePlans();
  const updatePlan = useUpdatePlan();
  const bulkInsert = useBulkInsert();
  const insertPlan = useInsertPlan();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importTitle, setImportTitle] = useState("");

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
      category: autoCategorize(i.title).category,
      severity: "medium",
      status: "open",
      is_on_todo: true,
      plan_id: plan.id,
    }));
    bulkInsert.mutate(newItems as any[]);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const parsedItems = parsePlanText(importText);
    if (parsedItems.length === 0) {
      toast.error("Could not parse any plan items from the text");
      return;
    }
    const crossReferenced = crossReferenceItems(parsedItems, items);
    const title = importTitle.trim() || `Imported Plan — ${new Date().toLocaleDateString()}`;
    insertPlan.mutate({
      plan_title: title,
      plan_summary: importText.slice(0, 500),
      plan_items: crossReferenced,
      source: "chat",
      chat_context: importText.slice(0, 5000),
    });
    setImportText("");
    setImportTitle("");
    setImportOpen(false);
  };

  const autoAnalyzePlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const updated = crossReferenceItems(plan.plan_items, items);
    const changes = updated.filter((u, i) => u.status !== plan.plan_items[i].status).length;
    updatePlan.mutate({ id: planId, plan_items: updated });
    toast.success(`Auto-analyzed: ${changes} items updated based on tracker state`);
  };

  const statusIcon = (s: string) => {
    if (s === "implemented") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (s === "partial") return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Track implementation plans, auto-import from chat, and cross-reference against tracker items.
        </p>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(!importOpen)}>
          <Upload className="h-3.5 w-3.5 mr-1" /> Import Plan from Chat
        </Button>
      </div>

      {importOpen && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Plan title (optional)" value={importTitle} onChange={e => setImportTitle(e.target.value)} />
            <Textarea
              placeholder="Paste a plan from chat here... Each line, bullet point, or numbered item becomes a plan step. The system will auto-match against existing tracker items."
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="min-h-[150px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={insertPlan.isPending || !importText.trim()}>
                {insertPlan.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Parse & Import
              </Button>
              <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium mb-1">No plans tracked yet</p>
            <p className="text-sm text-muted-foreground">Import a plan from chat or use the AI Analyst to generate one.</p>
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
                          {plan.source === "chat" ? "From Chat" : plan.source === "ai_analyst" ? "AI Analyst" : "Manual"} · {new Date(plan.created_at).toLocaleDateString()}
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
                        {item.tracker_item_id && <Badge variant="outline" className="text-[9px]">linked</Badge>}
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
                    <Button size="sm" variant="ghost" onClick={() => autoAnalyzePlan(plan.id)}>
                      Auto-Analyze
                    </Button>
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
