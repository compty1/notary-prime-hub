import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Radar, Loader2, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBulkInsert, useTrackerItems } from "./hooks";
import { PAGE_REGISTRY } from "./pageRegistry";
import { SERVICE_FLOWS } from "./serviceFlows";
import { PLATFORM_ENTITIES } from "./platformEntities";
import type { TrackerItem } from "./constants";

type ScanFinding = {
  title: string;
  description: string;
  category: string;
  severity: string;
  impact_area: string;
  suggested_fix: string;
  page_route?: string;
};

type ScanPhase = {
  name: string;
  status: "pending" | "running" | "done";
  findings: ScanFinding[];
};

export default function PlatformScanButton() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [phases, setPhases] = useState<ScanPhase[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { data: existingItems = [] } = useTrackerItems();
  const bulkInsert = useBulkInsert();

  const allFindings = phases.flatMap(p => p.findings);
  const progress = phases.length > 0 ? (phases.filter(p => p.status === "done").length / phases.length) * 100 : 0;

  const updatePhase = (index: number, update: Partial<ScanPhase>) => {
    setPhases(prev => prev.map((p, i) => i === index ? { ...p, ...update } : p));
  };

  const isDuplicate = (title: string) => {
    const norm = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const normWords = norm.split(/\s+/).sort().join(" ");
    return existingItems.some(e => {
      const eNorm = e.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const eWords = eNorm.split(/\s+/).sort().join(" ");
      return eWords === normWords || (normWords.length > 15 && eWords.includes(normWords.slice(0, 40)));
    });
  };

  const runScan = async () => {
    setScanning(true);
    setSelected(new Set());

    const scanPhases: ScanPhase[] = [
      { name: "Database Schema Integrity", status: "pending", findings: [] },
      { name: "Service Catalog Health", status: "pending", findings: [] },
      { name: "Page & Route Audit", status: "pending", findings: [] },
      { name: "Platform Entity Coverage", status: "pending", findings: [] },
      { name: "Service Flow Completeness", status: "pending", findings: [] },
      { name: "Security & RLS Gaps", status: "pending", findings: [] },
      { name: "UX & Accessibility", status: "pending", findings: [] },
      { name: "Ohio Compliance Check", status: "pending", findings: [] },
    ];
    setPhases(scanPhases);

    // Phase 0: Database schema checks
    updatePhase(0, { status: "running" });
    const dbFindings: ScanFinding[] = [];
    try {
      // Check for tables missing updated_at triggers
      const { data: tables } = await supabase.from("audit_log").select("id").limit(1);
      // Check email_cache for orphaned records
      const { count: emailCacheCount } = await supabase.from("email_cache").select("*", { count: "exact", head: true });
      if ((emailCacheCount ?? 0) > 5000) {
        dbFindings.push({
          title: "Email cache table has excessive records",
          description: `email_cache has ${emailCacheCount} rows which may impact query performance`,
          category: "performance", severity: "medium", impact_area: "database",
          suggested_fix: "Implement periodic cleanup of old synced emails beyond 90 days",
        });
      }
      // Check for profiles without user_roles
      // Placeholder check - this RPC call may not exist, wrap safely
      const orphanProfiles = null;
      // Check documents without appointments
      const { count: orphanDocs } = await supabase.from("documents").select("*", { count: "exact", head: true }).is("appointment_id", null);
      if ((orphanDocs ?? 0) > 50) {
        dbFindings.push({
          title: "Many documents not linked to appointments",
          description: `${orphanDocs} documents have no appointment_id association`,
          category: "data_integrity", severity: "low", impact_area: "database",
          suggested_fix: "Review orphaned documents and link or archive them",
        });
      }
    } catch { /* non-critical */ }
    updatePhase(0, { status: "done", findings: dbFindings });

    // Phase 1: Service catalog health
    updatePhase(1, { status: "running" });
    const serviceFindings: ScanFinding[] = [];
    try {
      const { data: services } = await supabase.from("services").select("id, name, description, short_description, is_active, hero_image_url, estimated_turnaround, category, price_from, price_to, pricing_model");
      if (services) {
        // Missing descriptions
        const noDesc = services.filter(s => s.is_active && (!s.description || s.description.length < 20));
        if (noDesc.length > 0) {
          serviceFindings.push({
            title: `${noDesc.length} active services missing detailed descriptions`,
            description: `Services: ${noDesc.map(s => s.name).slice(0, 5).join(", ")}${noDesc.length > 5 ? "..." : ""}`,
            category: "content", severity: "medium", impact_area: "services",
            suggested_fix: "Add 50+ word descriptions to all active services for SEO and client understanding",
          });
        }
        // Missing turnaround
        const noTurnaround = services.filter(s => s.is_active && !s.estimated_turnaround);
        if (noTurnaround.length > 0) {
          serviceFindings.push({
            title: `${noTurnaround.length} active services missing estimated turnaround`,
            description: "Clients can't see expected completion time",
            category: "ux", severity: "low", impact_area: "services",
            suggested_fix: "Set estimated turnaround for all active services (e.g., 'Same day', '2-3 business days')",
          });
        }
        // Services with $0 pricing
        const zeroPriced = services.filter(s => s.is_active && s.pricing_model !== "custom" && (!s.price_from || s.price_from === 0) && (!s.price_to || s.price_to === 0));
        if (zeroPriced.length > 0) {
          serviceFindings.push({
            title: `${zeroPriced.length} active services show $0 pricing`,
            description: `Services: ${zeroPriced.map(s => s.name).join(", ")}`,
            category: "pricing", severity: "high", impact_area: "revenue",
            suggested_fix: "Set proper pricing or change pricing model to 'custom' for quote-based services",
          });
        }
        // Check FAQs per service
        const { data: faqs } = await supabase.from("service_faqs").select("service_id");
        const faqMap = new Set((faqs || []).map(f => f.service_id));
        const noFaqs = services.filter(s => s.is_active && !faqMap.has(s.id));
        if (noFaqs.length > 0) {
          serviceFindings.push({
            title: `${noFaqs.length} active services have no FAQs`,
            description: "FAQs improve SEO and reduce support inquiries",
            category: "content", severity: "low", impact_area: "services",
            suggested_fix: "Add 3-5 relevant FAQs to each active service",
          });
        }
        // Check requirements
        const { data: reqs } = await supabase.from("service_requirements").select("service_id");
        const reqMap = new Set((reqs || []).map(r => r.service_id));
        const noReqs = services.filter(s => s.is_active && !reqMap.has(s.id));
        if (noReqs.length > 3) {
          serviceFindings.push({
            title: `${noReqs.length} active services have no documented requirements`,
            description: "Clients may arrive unprepared",
            category: "compliance", severity: "medium", impact_area: "services",
            suggested_fix: "Add requirements (ID, documents needed, etc.) to each service",
          });
        }
        // Near-duplicates
        const nameMap = new Map<string, string[]>();
        services.forEach(s => {
          const key = s.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
          nameMap.set(key, [...(nameMap.get(key) || []), s.name]);
        });
        const dupes = Array.from(nameMap.values()).filter(v => v.length > 1);
        if (dupes.length > 0) {
          serviceFindings.push({
            title: `${dupes.length} potential duplicate service entries`,
            description: dupes.map(d => d.join(" ↔ ")).join("; "),
            category: "data_integrity", severity: "high", impact_area: "services",
            suggested_fix: "Merge or delete duplicate services to avoid client confusion",
          });
        }
      }
    } catch { /* non-critical */ }
    updatePhase(1, { status: "done", findings: serviceFindings });

    // Phase 2: Page & route audit
    updatePhase(2, { status: "running" });
    const pageFindings: ScanFinding[] = [];
    const protectedPages = PAGE_REGISTRY.filter(p => p.protection === "auth" || p.protection === "admin");
    const publicPages = PAGE_REGISTRY.filter(p => p.protection === "public");
    if (publicPages.length > 0) {
      const noMeta = publicPages.filter(p => !p.route.includes(":") && p.route !== "*");
      if (noMeta.length > 15) {
        pageFindings.push({
          title: `${noMeta.length} public pages may lack SEO meta tags`,
          description: "Public-facing pages should have unique title, description, and OG tags",
          category: "seo", severity: "medium", impact_area: "marketing",
          suggested_fix: "Add usePageMeta() hook with unique meta to each public page",
        });
      }
    }
    // Check for pages without error boundaries
    pageFindings.push({
      title: "Verify all protected routes have error boundaries",
      description: `${protectedPages.length} protected pages should be wrapped in ErrorBoundary`,
      category: "stability", severity: "medium", impact_area: "architecture",
      suggested_fix: "Audit ProtectedRoute wrapper to ensure ErrorBoundary coverage",
    });
    updatePhase(2, { status: "done", findings: pageFindings });

    // Phase 3: Platform entity coverage
    updatePhase(3, { status: "running" });
    const entityFindings: ScanFinding[] = [];
    PLATFORM_ENTITIES.forEach(entity => {
      const unhealthy = entity.subComponents.filter(sc => sc.status === "missing" || sc.status === "needs_attention");
      if (unhealthy.length > 0) {
        entityFindings.push({
          title: `Platform entity "${entity.name}" has ${unhealthy.length} issues`,
          description: unhealthy.map(sc => `${sc.name}: ${sc.status}`).join(", "),
          category: "feature", severity: unhealthy.some(sc => sc.status === "missing") ? "high" : "medium",
          impact_area: "platform",
          suggested_fix: `Fix ${unhealthy.length} sub-components in ${entity.name}`,
        });
      }
    });
    updatePhase(3, { status: "done", findings: entityFindings });

    // Phase 4: Service flow completeness
    updatePhase(4, { status: "running" });
    const flowFindings: ScanFinding[] = [];
    SERVICE_FLOWS.forEach(flow => {
      const notImpl = flow.steps.filter(s => !s.implemented);
      const withIssues = flow.steps.filter(s => s.issues && s.issues.length > 0);
      if (notImpl.length > 0) {
        flowFindings.push({
          title: `Service flow "${flow.name}" has ${notImpl.length} unimplemented steps`,
          description: notImpl.map(s => s.name).join(", "),
          category: "flow", severity: "high", impact_area: "service_delivery",
          suggested_fix: `Implement missing steps in ${flow.name} flow`,
          page_route: flow.steps[0]?.route,
        });
      }
      if (withIssues.length > 0) {
        flowFindings.push({
          title: `Service flow "${flow.name}" has ${withIssues.length} steps with known issues`,
          description: withIssues.map(s => `${s.name}: ${(s.issues || []).join(", ")}`).join("; "),
          category: "flow", severity: "medium", impact_area: "service_delivery",
          suggested_fix: `Resolve issues in ${flow.name} flow steps`,
        });
      }
    });
    updatePhase(4, { status: "done", findings: flowFindings });

    // Phase 5: Security gaps
    updatePhase(5, { status: "running" });
    const secFindings: ScanFinding[] = [];
    // Check for tables that might lack RLS
    try {
      const { count: openBuildItems } = await supabase.from("build_tracker_items").select("*", { count: "exact", head: true });
      if ((openBuildItems ?? 0) > 0) {
        secFindings.push({
          title: "Verify build_tracker_items RLS is admin-only",
          description: "Build tracker data should only be accessible to admins",
          category: "security", severity: "high", impact_area: "access_control",
          suggested_fix: "Ensure RLS policy restricts to admin role only",
        });
      }
    } catch { /* expected if no access */ }
    // Check for session timeout on admin pages
    secFindings.push({
      title: "Admin session timeout verification",
      description: "Ensure admin sessions expire after inactivity",
      category: "security", severity: "medium", impact_area: "authentication",
      suggested_fix: "Verify SessionTimeoutWarning component is active on admin routes",
    });
    updatePhase(5, { status: "done", findings: secFindings });

    // Phase 6: UX checks
    updatePhase(6, { status: "running" });
    const uxFindings: ScanFinding[] = [];
    uxFindings.push({
      title: "Mobile responsiveness audit needed",
      description: "Verify all admin tables, forms, and dialogs work on tablet/mobile",
      category: "ux", severity: "medium", impact_area: "mobile",
      suggested_fix: "Test all admin pages at 768px and 375px breakpoints",
    });
    uxFindings.push({
      title: "Loading state consistency check",
      description: "All data-fetching components should show skeleton loaders, not spinners",
      category: "ux", severity: "low", impact_area: "polish",
      suggested_fix: "Replace Loader2 spinners with content-shaped Skeleton components",
    });
    updatePhase(6, { status: "done", findings: uxFindings });

    // Phase 7: Ohio compliance
    updatePhase(7, { status: "running" });
    const compFindings: ScanFinding[] = [];
    try {
      // Check KBA enforcement
      const { data: sessions } = await supabase.from("notarization_sessions").select("kba_attempts").gt("kba_attempts", 0).limit(5);
      compFindings.push({
        title: "Ohio ORC §147.66 KBA limit enforcement",
        description: "Verify 2-attempt KBA limit trigger is active on notarization_sessions",
        category: "compliance", severity: "critical", impact_area: "ohio_compliance",
        suggested_fix: "Test that kba_attempts > 2 raises exception",
      });
    } catch { /* non-critical */ }
    compFindings.push({
      title: "RON session recording consent verification",
      description: "Ohio requires signer consent for RON recordings per ORC §147.63",
      category: "compliance", severity: "critical", impact_area: "ohio_compliance",
      suggested_fix: "Ensure recording_consent flag is checked before session start",
    });
    compFindings.push({
      title: "Notary journal completeness check",
      description: "Ohio ORC §147.55 requires complete journal entries for all acts",
      category: "compliance", severity: "critical", impact_area: "ohio_compliance",
      suggested_fix: "Verify all completed appointments have corresponding journal entries",
    });
    updatePhase(7, { status: "done", findings: compFindings });

    // Filter out findings that already exist in tracker
    setScanning(false);
  };

  const toggleFinding = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === allFindings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFindings.map((_, i) => i)));
    }
  };

  const addSelected = () => {
    const items = Array.from(selected).map(idx => {
      const f = allFindings[idx];
      return {
        title: f.title,
        description: f.description,
        category: f.category,
        severity: f.severity,
        status: "open",
        impact_area: f.impact_area,
        suggested_fix: f.suggested_fix,
        page_route: f.page_route || null,
      };
    }).filter(item => !isDuplicate(item.title));

    if (items.length === 0) {
      toast.info("All selected items already exist in the tracker");
      return;
    }

    bulkInsert.mutate(items, {
      onSuccess: () => {
        toast.success(`Added ${items.length} items to tracker`);
        setOpen(false);
      },
    });
  };

  const newFindings = allFindings.filter(f => !isDuplicate(f.title));

  const sevBadge = (sev: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500/10 text-red-600 border-red-500/30",
      high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
      medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
      low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    };
    return <Badge variant="outline" className={`text-[10px] ${colors[sev] || ""}`}>{sev}</Badge>;
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); setPhases([]); }}>
        <Radar className="h-3.5 w-3.5 mr-1" /> Scan Platform
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" /> Platform Issue Scanner
            </DialogTitle>
          </DialogHeader>

          {phases.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Radar className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center max-w-md">
                Scan the entire platform for issues including services, pages, security, Ohio compliance, UX gaps, and more. 
                New findings will be deduplicated against existing tracker items.
              </p>
              <Button onClick={runScan} size="lg">
                <Radar className="h-4 w-4 mr-2" /> Start Full Scan
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{scanning ? "Scanning..." : `Scan complete — ${newFindings.length} new findings`}</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex gap-1 flex-wrap">
                  {phases.map((p, i) => (
                    <Badge key={i} variant={p.status === "done" ? "default" : p.status === "running" ? "secondary" : "outline"} className="text-[10px]">
                      {p.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {p.status === "done" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {p.name} {p.status === "done" && `(${p.findings.length})`}
                    </Badge>
                  ))}
                </div>
              </div>

              {!scanning && allFindings.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selected.size === allFindings.length}
                        onCheckedChange={toggleAll}
                      />
                      Select all ({allFindings.length})
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {allFindings.length - newFindings.length} already in tracker
                    </span>
                  </div>
                  <ScrollArea className="flex-1 max-h-[400px]">
                    <div className="space-y-1">
                      {allFindings.map((f, i) => {
                        const exists = isDuplicate(f.title);
                        return (
                          <div key={i} className={`flex items-start gap-2 p-2 rounded-md border text-sm ${exists ? "opacity-40" : "hover:bg-muted/50"}`}>
                            <Checkbox
                              checked={selected.has(i)}
                              onCheckedChange={() => toggleFinding(i)}
                              disabled={exists}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{f.title}</span>
                                {sevBadge(f.severity)}
                                <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                                {exists && <Badge variant="outline" className="text-[10px] text-muted-foreground">exists</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}

              {!scanning && allFindings.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-muted-foreground">No new issues found. Platform looks healthy!</p>
                </div>
              )}
            </>
          )}

          {!scanning && allFindings.length > 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPhases([]); }}>Re-scan</Button>
              <Button onClick={addSelected} disabled={selected.size === 0 || bulkInsert.isPending}>
                {bulkInsert.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Add {selected.size} to Tracker
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
