import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BarChart3, FileText, AlertTriangle, Clock, CheckCircle2, XCircle, Shield,
  Workflow, Globe, ClipboardList, Cpu, Bot, Mail, Activity, ChevronDown, ChevronRight,
  Sparkles, Lock, Zap,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TrackerItem, TrackerPlan } from "./constants";
import { SEVERITIES, CATEGORIES, severityColor, statusIcon, sevColors, relTime } from "./constants";
import { SERVICE_FLOWS } from "./serviceFlows";
import { PAGE_REGISTRY } from "./pageRegistry";
import { PLATFORM_ENTITIES, getEntityHealth } from "./platformEntities";
import { useBulkUpdate } from "./hooks";
import VerifyFixesButton from "./VerifyFixesButton";

type Props = {
  items: TrackerItem[];
  plans: TrackerPlan[];
  onJumpToGap: (id: string) => void;
  onTabChange?: (tab: string) => void;
  onOpenFeatureGen?: () => void;
};

export default function DashboardTab({ items, plans, onJumpToGap, onTabChange, onOpenFeatureGen }: Props) {
  const total = items.length;
  const open = items.filter((i) => i.status === "open").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const resolved = items.filter((i) => i.status === "resolved").length;
  const deferred = items.filter((i) => i.status === "deferred" || i.status === "wont_fix").length;
  const healthScore = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const bulkUpdate = useBulkUpdate();

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const bySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter((i) => i.status === "open" || i.status === "in_progress").forEach((i) => {
      map[i.severity] = (map[i.severity] || 0) + 1;
    });
    return SEVERITIES.map((s) => ({ name: s, value: map[s] || 0 })).filter((d) => d.value > 0);
  }, [items]);

  const byImpact = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter((i) => i.status !== "resolved" && i.status !== "wont_fix").forEach((i) => {
      const area = i.impact_area || "Uncategorized";
      map[area] = (map[area] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const recentlyUpdated = useMemo(() =>
    [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10),
    [items]
  );

  const flowHealth = useMemo(() =>
    SERVICE_FLOWS.map((f) => {
      const implemented = f.steps.filter((s) => s.implemented).length;
      return { name: f.name, pct: Math.round((implemented / f.steps.length) * 100), total: f.steps.length, implemented };
    }),
    []
  );

  const pagesWithIssues = useMemo(() => {
    const routeSet = new Set(items.filter((i) => i.page_route).map((i) => i.page_route!));
    return routeSet.size;
  }, [items]);

  const plansCompletion = useMemo(() => {
    if (!plans.length) return 0;
    const totalItems = plans.reduce((a, p) => a + p.plan_items.length, 0);
    const done = plans.reduce((a, p) => a + p.plan_items.filter((i) => i.status === "implemented").length, 0);
    return totalItems > 0 ? Math.round((done / totalItems) * 100) : 0;
  }, [plans]);

  const platformHealth = useMemo(() => {
    const allSub = PLATFORM_ENTITIES.flatMap(e => e.subComponents);
    const healthy = allSub.filter(s => s.status === "healthy").length;
    return { pct: Math.round((healthy / allSub.length) * 100), total: allSub.length, healthy };
  }, []);

  // Category Progress
  const categoryProgress = useMemo(() => {
    const map: Record<string, { total: number; resolved: number; openIds: string[] }> = {};
    items.forEach(i => {
      if (!map[i.category]) map[i.category] = { total: 0, resolved: 0, openIds: [] };
      map[i.category].total++;
      if (i.status === "resolved" || i.status === "wont_fix") map[i.category].resolved++;
      else map[i.category].openIds.push(i.id);
    });
    return Object.entries(map)
      .map(([cat, data]) => ({ category: cat, ...data, pct: Math.round((data.resolved / data.total) * 100) }))
      .sort((a, b) => a.pct - b.pct);
  }, [items]);

  // Recently Fixed (last 7 days)
  const recentlyFixed = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return items
      .filter(i => i.status === "resolved" && i.resolved_at && i.resolved_at > sevenDaysAgo)
      .sort((a, b) => new Date(b.resolved_at!).getTime() - new Date(a.resolved_at!).getTime());
  }, [items]);

  // Security & Compliance summary
  const securityItems = useMemo(() =>
    items.filter(i => (i.category === "security" || i.category === "compliance") && i.status !== "resolved" && i.status !== "wont_fix"),
    [items]
  );

  // Functionality summary
  const functionalityItems = useMemo(() =>
    items.filter(i => (i.category === "feature" || i.category === "workflow") && i.status !== "resolved" && i.status !== "wont_fix"),
    [items]
  );

  const [recentlyFixedOpen, setRecentlyFixedOpen] = useState(false);

  const goTo = (tab: string) => onTabChange?.(tab);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Items", value: total, icon: <FileText className="h-4 w-4" /> },
          { label: "Open", value: open, icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
          { label: "In Progress", value: inProgress, icon: <Clock className="h-4 w-4 text-blue-500" /> },
          { label: "Resolved", value: resolved, icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: "Deferred", value: deferred, icon: <XCircle className="h-4 w-4 text-muted-foreground" /> },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              {kpi.icon}
              <div><p className="text-2xl font-bold">{kpi.value}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap gap-2">
        <VerifyFixesButton items={items} />
        {onOpenFeatureGen && (
          <Button variant="outline" size="sm" onClick={onOpenFeatureGen}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Feature Generator
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("gaps")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Build Health</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{healthScore}%</div>
            <Progress value={healthScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{resolved}/{total} resolved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("platform")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4" /> Platform Health</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{platformHealth.pct}%</div>
            <Progress value={platformHealth.pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{platformHealth.healthy}/{platformHealth.total} components healthy</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("pages")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Pages with Issues</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pagesWithIssues}</div>
            <p className="text-xs text-muted-foreground">of {PAGE_REGISTRY.length} total routes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("plans")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Plans Completion</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{plansCompletion}%</div>
            <Progress value={plansCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{plans.length} plans tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Functionality Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("gaps")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-destructive" /> Security & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{securityItems.length} open</div>
            <div className="flex flex-wrap gap-1">
              {SEVERITIES.map(s => {
                const count = securityItems.filter(i => i.severity === s).length;
                return count > 0 ? <Badge key={s} className={`text-[10px] ${severityColor[s]}`}>{s}: {count}</Badge> : null;
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("gaps")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Functionality Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{functionalityItems.length} open</div>
            <div className="flex flex-wrap gap-1">
              {["feature", "workflow"].map(cat => {
                const count = functionalityItems.filter(i => i.category === cat).length;
                return count > 0 ? <Badge key={cat} variant="outline" className="text-[10px]">{cat}: {count}</Badge> : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress Bars */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Category Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryProgress.map(cp => (
              <div key={cp.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize">{cp.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{cp.resolved}/{cp.total}</span>
                    <span className="text-xs font-bold">{cp.pct}%</span>
                    {cp.openIds.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]"
                        onClick={() => bulkUpdate.mutate({ ids: cp.openIds, fields: { status: "resolved", resolved_at: new Date().toISOString() } })}>
                        Resolve All
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={cp.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recently Fixed */}
      {recentlyFixed.length > 0 && (
        <Collapsible open={recentlyFixedOpen} onOpenChange={setRecentlyFixedOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-2 cursor-pointer">
                <CardTitle className="text-sm flex items-center gap-2">
                  {recentlyFixedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Recently Fixed ({recentlyFixed.length} in last 7 days)
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-1.5">
                  {recentlyFixed.slice(0, 20).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-muted/50 cursor-pointer" onClick={() => onJumpToGap(item.id)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{item.category}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{relTime(item.resolved_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Service Flow Health */}
      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("flows")}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4" /> Service Flow Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {flowHealth.map((f) => (
              <div key={f.name} className="rounded-lg border p-3">
                <p className="text-xs font-medium truncate">{f.name}</p>
                <div className="text-lg font-bold mt-1">{f.pct}%</div>
                <Progress value={f.pct} className="h-1.5 mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.implemented}/{f.total} steps</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("ai")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">AI Build Analyst</p>
              <p className="text-xs text-muted-foreground">UX, compliance, marketing & architecture analysis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => goTo("emails")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Email Templates</p>
              <p className="text-xs text-muted-foreground">14 automated templates · Master template editor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Items by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            {byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open by Severity</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySeverity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySeverity}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {bySeverity.map((d) => <Cell key={d.name} fill={sevColors[d.name] || "#94a3b8"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No open items</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open by Impact Area</CardTitle></CardHeader>
          <CardContent className="h-64">
            {byImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byImpact} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" fontSize={10} width={100} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--accent))" radius={[0,4,4,0]} /></BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No open items</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recently Updated</CardTitle></CardHeader>
        <CardContent>
          {recentlyUpdated.length > 0 ? (
            <div className="space-y-2">
              {recentlyUpdated.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors" onClick={() => onJumpToGap(item.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    {statusIcon[item.status]}
                    <span className="truncate">{item.title}</span>
                    <Badge className={`text-[10px] ${severityColor[item.severity]}`}>{item.severity}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{relTime(item.updated_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No items tracked yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
