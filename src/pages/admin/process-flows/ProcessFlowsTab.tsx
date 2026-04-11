import { useState, useMemo } from "react";
import { SERVICE_FLOWS } from "@/pages/admin/build-tracker/serviceFlows";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, AlertCircle, Zap, Search, ChevronDown, ChevronRight, Mail
} from "lucide-react";

export default function ProcessFlowsTab() {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set(["booking"]));
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFlow = (id: string) => {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredFlows = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_FLOWS;
    const q = searchQuery.toLowerCase();
    return SERVICE_FLOWS.map(flow => ({
      ...flow,
      steps: flow.steps.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.component && s.component.toLowerCase().includes(q))),
    })).filter(f => f.steps.length > 0 || f.name.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search flows, steps, components…"
          className="pl-10 rounded-xl border-2 border-border"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredFlows.map(flow => (
        <Card key={flow.id} className="rounded-[24px] border-2 border-border shadow-md overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
            onClick={() => toggleFlow(flow.id)}
          >
            <div className="flex items-center gap-3">
              {expandedFlows.has(flow.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <div className="text-left">
                <h3 className="font-black text-sm text-foreground">{flow.name}</h3>
                <p className="text-xs text-muted-foreground">{flow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs rounded-lg font-bold border-2">
                {flow.steps.filter(s => s.implemented).length}/{flow.steps.length} steps
              </Badge>
              {flow.steps.some(s => s.issues?.length) && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs rounded-lg font-bold">
                  {flow.steps.filter(s => s.issues?.length).length} issues
                </Badge>
              )}
            </div>
          </button>

          {expandedFlows.has(flow.id) && (
            <div className="border-t-2 border-border divide-y divide-[hsl(220,10%,92%)]">
              {flow.steps.map((step, i) => (
                <div key={i} className="px-4 py-3 flex items-start justify-between hover:bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.implemented ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {step.route && <p className="text-xs text-[hsl(45,96%,50%)] font-mono mt-0.5">{step.route}</p>}
                      {step.component && <Badge variant="outline" className="text-[10px] mt-1 rounded-md font-bold border-2">{step.component}</Badge>}
                      {step.automations && step.automations.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {step.automations.map((a, ai) => (
                            <Badge key={ai} className="bg-primary/10 text-[hsl(45,96%,40%)] text-[10px] rounded-md font-bold">
                              <Zap className="h-2.5 w-2.5 mr-0.5" /> {a.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {step.emailTemplateKey && (
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] mt-1 rounded-md font-bold">
                          <Mail className="h-2.5 w-2.5 mr-0.5" /> {step.emailTemplateKey}
                        </Badge>
                      )}
                      {step.issues?.map((issue, ii) => (
                        <p key={ii} className="text-xs text-amber-600 mt-1 font-semibold">⚠ {issue}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
