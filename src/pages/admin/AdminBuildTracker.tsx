import { useState, useMemo, useCallback, useEffect } from "react";
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
  Workflow, Globe, ClipboardList, Cpu, Bot, Mail,
} from "lucide-react";
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
import AIAnalystTab from "./build-tracker/AIAnalystTab";
import EmailTemplatesTab from "./build-tracker/EmailTemplatesTab";

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
  const [filteredGapCount, setFilteredGapCount] = useState<number | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
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

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredGapCount(count);
  }, []);

  const handleReanalyze = useCallback(async () => {
    setIsReanalyzing(true);
    try {
      await reanalyze();
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
          <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={isReanalyzing}>
            <RotateCcw className={`h-3.5 w-3.5 mr-1 ${isReanalyzing ? "animate-spin" : ""}`} /> Re-analyze
          </Button>
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
            <TabsTrigger value="plans" className="gap-1"><ClipboardList className="h-4 w-4" /> Plan History</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1"><Bot className="h-4 w-4" /> AI Analyst</TabsTrigger>
            <TabsTrigger value="emails" className="gap-1"><Mail className="h-4 w-4" /> Email Templates</TabsTrigger>
            <TabsTrigger value="add" className="gap-1"><Plus className="h-4 w-4" /> Add / Import</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="dashboard"><DashboardTab items={items} plans={plans} onJumpToGap={handleJumpToGap} onTabChange={setActiveTab} /></TabsContent>
        <TabsContent value="gaps"><GapAnalysisTab items={items} jumpToId={jumpToGapId} onFilteredCountChange={handleFilteredCountChange} /></TabsContent>
        <TabsContent value="todo"><TodoTab items={items} /></TabsContent>
        <TabsContent value="flows"><ServiceFlowTab items={items} /></TabsContent>
        <TabsContent value="platform"><PlatformFunctionsTab items={items} /></TabsContent>
        <TabsContent value="pages"><PageAuditorTab items={items} /></TabsContent>
        <TabsContent value="plans"><PlanHistoryTab items={items} /></TabsContent>
        <TabsContent value="ai"><AIAnalystTab items={items} plans={plans} /></TabsContent>
        <TabsContent value="emails"><EmailTemplatesTab /></TabsContent>
        <TabsContent value="add"><AddImportTab /></TabsContent>
      </Tabs>

      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
