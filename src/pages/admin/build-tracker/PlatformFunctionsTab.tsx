import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, MinusCircle,
  Search, Mail, BookOpen, Calendar, CreditCard, FileText, Video, Users, LayoutDashboard,
  Building, Settings, Brain, Shield, Bell, Activity,
} from "lucide-react";
import { PLATFORM_ENTITIES, getEntityHealth } from "./platformEntities";
import type { PlatformEntity, EntityStatus, SubComponent } from "./platformEntities";
import type { TrackerItem } from "./constants";

const ICON_MAP: Record<string, React.ReactNode> = {
  Mail: <Mail className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Video: <Video className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
};

const STATUS_COLORS: Record<EntityStatus, string> = {
  healthy: "text-success",
  partial: "text-warning",
  needs_attention: "text-warning",
  missing: "text-destructive",
};

const STATUS_ICONS: Record<EntityStatus, React.ReactNode> = {
  healthy: <CheckCircle2 className="h-4 w-4 text-success" />,
  partial: <MinusCircle className="h-4 w-4 text-warning" />,
  needs_attention: <AlertTriangle className="h-4 w-4 text-warning" />,
  missing: <AlertCircle className="h-4 w-4 text-destructive" />,
};

type Props = { items: TrackerItem[] };

export default function PlatformFunctionsTab({ items }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const domains = useMemo(() => {
    const set = new Set(PLATFORM_ENTITIES.map(e => e.domain));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    let result = PLATFORM_ENTITIES;
    if (domainFilter !== "all") result = result.filter(e => e.domain === domainFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.subComponents.some(s => s.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, domainFilter]);

  const overallHealth = useMemo(() => {
    const allSub = PLATFORM_ENTITIES.flatMap(e => e.subComponents);
    const healthy = allSub.filter(s => s.status === "healthy").length;
    return Math.round((healthy / allSub.length) * 100);
  }, []);

  const relatedItems = (entity: PlatformEntity) => {
    const keywords = [entity.name.toLowerCase(), ...entity.subComponents.map(s => s.name.toLowerCase())];
    return items.filter(item =>
      keywords.some(k => item.title.toLowerCase().includes(k) || (item.impact_area || "").toLowerCase().includes(k))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search entities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {domains.map(d => (
            <Button key={d} size="sm" variant={domainFilter === d ? "default" : "outline"} onClick={() => setDomainFilter(d)} className="text-xs capitalize">
              {d}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Activity className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Overall Platform Health</span>
              <span className="text-lg font-bold">{overallHealth}%</span>
            </div>
            <Progress value={overallHealth} className="h-2" />
          </div>
          <div className="text-xs text-muted-foreground">
            {PLATFORM_ENTITIES.length} entities · {PLATFORM_ENTITIES.flatMap(e => e.subComponents).length} components
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filtered.map(entity => {
          const health = getEntityHealth(entity);
          const related = relatedItems(entity);
          const isExpanded = expanded === entity.id;

          return (
            <Card key={entity.id}>
              <Collapsible open={isExpanded} onOpenChange={o => setExpanded(o ? entity.id : null)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {ICON_MAP[entity.icon] || <Settings className="h-4 w-4" />}
                        <div>
                          <CardTitle className="text-sm">{entity.name}</CardTitle>
                          <CardDescription className="text-xs">{entity.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{entity.domain}</Badge>
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[health.status]}
                          <span className="text-sm font-bold">{health.healthPct}%</span>
                        </div>
                        {related.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{related.length} tracker items</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid gap-1">
                      {entity.subComponents.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors text-sm">
                          {STATUS_ICONS[sub.status]}
                          <span className="flex-1">{sub.name}</span>
                          <span className="text-xs text-muted-foreground max-w-[300px] truncate">{sub.description}</span>
                          {sub.route && <Badge variant="outline" className="text-[10px] font-mono">{sub.route}</Badge>}
                          {sub.edgeFunction && <Badge variant="outline" className="text-[10px] font-mono bg-info/10">{sub.edgeFunction}</Badge>}
                        </div>
                      ))}
                    </div>
                    {related.length > 0 && (
                      <div className="border-t pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Related Tracker Items</p>
                        {related.slice(0, 5).map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-xs py-0.5">
                            <Badge className="text-[9px]" variant={item.status === "resolved" ? "secondary" : "destructive"}>{item.status}</Badge>
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))}
                        {related.length > 5 && <p className="text-[10px] text-muted-foreground">+{related.length - 5} more</p>}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
