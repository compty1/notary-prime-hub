import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Plus, AlertTriangle, Search } from "lucide-react";
import { SERVICE_FLOWS, type ServiceFlow, type FlowStep } from "./serviceFlows";
import type { TrackerItem } from "./constants";
import { useBulkInsert } from "./hooks";

type Props = {
  items: TrackerItem[];
};

export default function ServiceFlowTab({ items }: Props) {
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const bulkInsert = useBulkInsert();

  const flowStats = useMemo(() =>
    SERVICE_FLOWS.map((f) => {
      const impl = f.steps.filter((s) => s.implemented).length;
      const issues = f.steps.reduce((a, s) => a + (s.issues?.length ?? 0), 0);
      return { ...f, implemented: impl, pct: Math.round((impl / f.steps.length) * 100), issueCount: issues };
    }),
    []
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return flowStats;
    const q = search.toLowerCase();
    return flowStats.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.steps.some(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
  }, [flowStats, search]);

  const addFlowGaps = (flow: ServiceFlow) => {
    const gaps = flow.steps.filter((s) => !s.implemented || (s.issues && s.issues.length > 0));
    if (gaps.length === 0) { toast.info("No gaps found in this flow"); return; }

    const newItems = gaps.flatMap((step) => {
      const items: any[] = [];
      if (!step.implemented) {
        items.push({
          title: `[${flow.name}] ${step.name} — Not Implemented`,
          description: step.description,
          category: "gap",
          severity: "high",
          status: "open",
          impact_area: flow.name,
          suggested_fix: `Implement ${step.name}: ${step.description}`,
          page_route: step.route || null,
        });
      }
      if (step.issues) {
        step.issues.forEach((issue) => {
          items.push({
            title: `[${flow.name}] ${step.name} — ${issue}`,
            description: issue,
            category: "gap",
            severity: "medium",
            status: "open",
            impact_area: flow.name,
            page_route: step.route || null,
          });
        });
      }
      return items;
    });

    bulkInsert.mutate(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Analyze each service flow step-by-step. Green = implemented, Red = missing, Yellow = has issues.
        </p>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search flows..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No flows match your search.</CardContent>
        </Card>
      )}

      {filtered.map((flow) => (
        <Card key={flow.id}>
          <Collapsible open={expandedFlow === flow.id} onOpenChange={(o) => setExpandedFlow(o ? flow.id : null)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedFlow === flow.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <CardTitle className="text-base">{flow.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{flow.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {flow.issueCount > 0 && (
                      <Badge variant="outline" className="text-xs text-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {flow.issueCount} issues
                      </Badge>
                    )}
                    <div className="text-right min-w-[80px]">
                      <div className="text-sm font-bold">{flow.pct}%</div>
                      <Progress value={flow.pct} className="h-1.5 w-20" />
                    </div>
                    <Badge className="text-xs">{flow.implemented}/{flow.steps.length}</Badge>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {flow.steps.map((step, idx) => (
                    <Collapsible key={idx} open={expandedStep === `${flow.id}-${idx}`}
                      onOpenChange={(o) => setExpandedStep(o ? `${flow.id}-${idx}` : null)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                          {step.implemented && (!step.issues || step.issues.length === 0) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : step.implemented && step.issues && step.issues.length > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <span className="text-sm flex-1">{step.name}</span>
                          {step.route && <span className="text-[10px] text-muted-foreground">{step.route}</span>}
                          {step.component && <Badge variant="outline" className="text-[10px]">{step.component}</Badge>}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-8 p-2 text-sm text-muted-foreground border-l-2 border-muted">
                          <p>{step.description}</p>
                          {step.issues && step.issues.map((issue, j) => (
                            <p key={j} className="text-yellow-600 mt-1">⚠ {issue}</p>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => addFlowGaps(flow)} disabled={bulkInsert.isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add All Gaps to Tracker
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
