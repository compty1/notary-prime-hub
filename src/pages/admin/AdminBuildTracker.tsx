import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search, Plus, BarChart3, ListChecks, Upload, Loader2, RefreshCw, RotateCcw,
  Workflow, Globe, ClipboardList, Cpu, Bot, Mail, Monitor, Palette, Sparkles, SwatchBook,
} from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTrackerItems, useInsertItem, usePlans, useRefreshAll, useReanalyze } from "./build-tracker/hooks";
import { CATEGORIES, SEVERITIES } from "./build-tracker/constants";
import DashboardTab from "./build-tracker/DashboardTab";
import GapAnalysisTab from "./build-tracker/GapAnalysisTab";
import TodoTab from "./build-tracker/TodoTab";
import AddImportTab from "./build-tracker/AddImportTab";
import ServiceFlowTab from "./build-tracker/ServiceFlowTab";
import PageAuditorTab from "./build-tracker/PageAuditorTab";
import PlanHistoryTab from "./build-tracker/PlanHistoryTab";
import PlatformFunctionsTab from "./build-tracker/PlatformFunctionsTab";
import DesignFeatureDialog from "./build-tracker/DesignFeatureDialog";

// Lazy-load heavy AI/Brand/Theme tabs
const AIAnalystTab = lazy(() => import("./build-tracker/AIAnalystTab"));
const EmailTemplatesTab = lazy(() => import("./build-tracker/EmailTemplatesTab"));
const LivePreviewTab = lazy(() => import("./build-tracker/LivePreviewTab"));
const BrandAnalysisTab = lazy(() => import("./build-tracker/BrandAnalysisTab"));
const ThemeExplorerTab = lazy(() => import("./build-tracker/ThemeExplorerTab"));

function TabFallback() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

function TabErrorBoundary({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <ErrorBoundary fallbackMessage={`${name} tab encountered an error`}>
      {children}
    </ErrorBoundary>
  );
}

/* ─── Quick Add Dialog ─── */
function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insert = useInsertItem();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gap");
  const [severity, setSeverity] = useState("medium");
  const [impactArea, setImpactArea] = useState("");
  const [pageRoute, setPageRoute] = useState("");

  const handleClose = () => { setTitle(""); setCategory("gap"); setSeverity("medium"); setImpactArea(""); setPageRoute(""); onClose(); };
  const handleSubmit = () => {
    if (!title.trim()) return;
    insert.mutate({ title, category, severity, status: "open", impact_area: impactArea || undefined, page_route: pageRoute || undefined } as any);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Quick Add Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Impact area (optional)" value={impactArea} onChange={(e) => setImpactArea(e.target.value)} />
          <Input placeholder="Page route (optional, e.g. /portal)" value={pageRoute} onChange={(e) => setPageRoute(e.target.value)} />
          <Button onClick={handleSubmit} className="w-full">Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function AdminBuildTracker() {
  usePageTitle("Build Tracker");
  const { data: items = [], isLoading, error, isFetching } = useTrackerItems();
  const { data: plans = [] } = usePlans();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [jumpToGapId, setJumpToGapId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [featureGenOpen, setFeatureGenOpen] = useState(false);
  const [filteredGapCount, setFilteredGapCount] = useState<number | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const refreshAll = useRefreshAll();
  const reanalyze = useReanalyze(items);

  const todoCount = useMemo(() => items.filter((i) => i.is_on_todo).length, [items]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleJumpToGap = useCallback((id: string) => {
    setJumpToGapId(id);
    setActiveTab("gaps");
  }, []);

  // Clear jumpToGapId after it's been consumed
  const handleJumpConsumed = useCallback(() => {
    setJumpToGapId(null);
  }, []);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredGapCount(count);
  }, []);

  const handleReanalyze = useCallback(async () => {
    setIsReanalyzing(true);
    try {
      await reanalyze();
      setLastAnalyzed(new Date().toISOString());
    } finally {
      setIsReanalyzing(false);
    }
  }, [reanalyze]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-6 text-destructive">Failed to load tracker: {(error as Error).message}</div>;

  const gapTabLabel = filteredGapCount !== null && filteredGapCount !== items.length
    ? `Gap Analysis (${filteredGapCount}/${items.length})`
    : `Gap Analysis (${items.length})`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Build Intelligence & Gap Tracker</h1>
          <p className="text-muted-foreground">Comprehensive platform analysis, AI reasoning, flow diagnostics & email management</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setFeatureGenOpen(true)}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Feature Gen
          </Button>
          <div className="flex flex-col items-end">
            <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={isReanalyzing}>
              <RotateCcw className={`h-3.5 w-3.5 mr-1 ${isReanalyzing ? "animate-spin" : ""}`} /> Re-analyze
            </Button>
            {lastAnalyzed && <span className="text-[10px] text-muted-foreground mt-0.5">Last: {new Date(lastAnalyzed).toLocaleTimeString()}</span>}
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setQuickAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Quick Add (N)</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-max justify-start h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-1"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="gaps" className="gap-1"><Search className="h-4 w-4" /> {gapTabLabel}</TabsTrigger>
            <TabsTrigger value="todo" className="gap-1"><ListChecks className="h-4 w-4" /> To-Do ({todoCount})</TabsTrigger>
            <TabsTrigger value="flows" className="gap-1"><Workflow className="h-4 w-4" /> Service Flows</TabsTrigger>
            <TabsTrigger value="platform" className="gap-1"><Cpu className="h-4 w-4" /> Platform Functions</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1"><Globe className="h-4 w-4" /> Page Auditor</TabsTrigger>
            <TabsTrigger value="plans" className="gap-1"><ClipboardList className="h-4 w-4" /> Plan History ({plans.length})</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1"><Bot className="h-4 w-4" /> AI Analyst</TabsTrigger>
            <TabsTrigger value="preview" className="gap-1"><Monitor className="h-4 w-4" /> Preview</TabsTrigger>
            <TabsTrigger value="brand" className="gap-1"><Palette className="h-4 w-4" /> Brand</TabsTrigger>
            <TabsTrigger value="themes" className="gap-1"><SwatchBook className="h-4 w-4" /> Themes</TabsTrigger>
            <TabsTrigger value="emails" className="gap-1"><Mail className="h-4 w-4" /> Email Templates</TabsTrigger>
            <TabsTrigger value="add" className="gap-1"><Plus className="h-4 w-4" /> Add / Import</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="dashboard">
          <TabErrorBoundary name="Dashboard">
            <DashboardTab items={items} plans={plans} onJumpToGap={handleJumpToGap} onTabChange={setActiveTab} onOpenFeatureGen={() => setFeatureGenOpen(true)} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="gaps">
          <TabErrorBoundary name="Gap Analysis">
            <GapAnalysisTab items={items} jumpToId={jumpToGapId} onFilteredCountChange={handleFilteredCountChange} onJumpConsumed={handleJumpConsumed} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="todo">
          <TabErrorBoundary name="To-Do">
            <TodoTab items={items} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="flows">
          <TabErrorBoundary name="Service Flows">
            <ServiceFlowTab items={items} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="platform">
          <TabErrorBoundary name="Platform Functions">
            <PlatformFunctionsTab items={items} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="pages">
          <TabErrorBoundary name="Page Auditor">
            <PageAuditorTab items={items} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="plans">
          <TabErrorBoundary name="Plan History">
            <PlanHistoryTab items={items} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="ai">
          <TabErrorBoundary name="AI Analyst">
            <Suspense fallback={<TabFallback />}>
              <AIAnalystTab items={items} plans={plans} />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="preview">
          <TabErrorBoundary name="Preview">
            <Suspense fallback={<TabFallback />}>
              <LivePreviewTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="brand">
          <TabErrorBoundary name="Brand">
            <Suspense fallback={<TabFallback />}>
              <BrandAnalysisTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="themes">
          <TabErrorBoundary name="Themes">
            <Suspense fallback={<TabFallback />}>
              <ThemeExplorerTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="emails">
          <TabErrorBoundary name="Email Templates">
            <Suspense fallback={<TabFallback />}>
              <EmailTemplatesTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="add">
          <TabErrorBoundary name="Add/Import">
            <AddImportTab />
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>

      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <DesignFeatureDialog open={featureGenOpen} onClose={() => setFeatureGenOpen(false)} />
    </div>
  );
}
