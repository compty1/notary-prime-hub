import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Plus, Eye, FileText, BarChart3, Users, Loader2, Search, Package } from "lucide-react";
import { format } from "date-fns";

const UX_SERVICE_TYPES = [
  { value: "ux_audit", label: "UX Audit", price: "$599" },
  { value: "workflow_mapping", label: "UX Workflow Mapping", price: "$299" },
  { value: "service_flow_redesign", label: "Service Flow Redesign", price: "$799" },
  { value: "cro", label: "Conversion Rate Optimization", price: "$999" },
  { value: "ux_copywriting", label: "UX Copywriting", price: "$499" },
  { value: "journey_mapping", label: "Customer Journey Mapping", price: "$699" },
  { value: "design_system", label: "Design System Creation", price: "$1,999" },
  { value: "accessibility_audit", label: "Accessibility Audit", price: "$499" },
  { value: "user_research", label: "User Research", price: "$899" },
  { value: "prototype_dev", label: "Prototype Development", price: "$1,499" },
  { value: "info_architecture", label: "Information Architecture", price: "$799" },
  { value: "onboarding_design", label: "Onboarding Flow Design", price: "$599" },
  { value: "dashboard_ux", label: "Dashboard/Analytics UX", price: "$899" },
  { value: "mobile_ux", label: "Mobile UX Optimization", price: "$699" },
  { value: "ux_training", label: "UX Training Workshop", price: "$2,999" },
] as const;

const STATUSES = ["intake", "scoping", "in_progress", "review", "delivered", "closed"] as const;
const PACKAGES = [
  { value: "starter", label: "Starter ($799)", services: "Audit + 1 Redesign" },
  { value: "growth", label: "Growth ($2,499)", services: "Audit + 3 Services + Research" },
  { value: "enterprise", label: "Enterprise ($4,999)", services: "Full Suite + Training" },
];

const statusColors: Record<string, string> = {
  intake: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  scoping: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  review: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminUXConsulting() {
  usePageMeta({ title: "UX Consulting — Admin", noIndex: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Record<string, any> | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["ux-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ux_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ["ux-deliverables", selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("ux_deliverables")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  const { data: auditReports = [] } = useQuery({
    queryKey: ["ux-audit-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ux_audit_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: async (project: any) => {
      const { error } = await supabase.from("ux_projects").insert(project);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ux-projects"] });
      setShowNewProject(false);
      toast({ title: "Project created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("ux_projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ux-projects"] });
      toast({ title: "Project updated" });
    },
  });

  const filtered = projects.filter((p: any) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p: any) => ["in_progress", "scoping", "review"].includes(p.status)).length,
    delivered: projects.filter((p: any) => p.status === "delivered").length,
    revenue: projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" /> UX Consulting
          </h1>
          <p className="text-sm text-muted-foreground">Manage UX projects, deliverables, and audit reports</p>
        </div>
        <Button onClick={() => setShowNewProject(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Projects</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-primary">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-2xl font-bold text-green-600">{stats.delivered}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Revenue Pipeline</p><p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1"><Users className="h-3.5 w-3.5" /> Projects</TabsTrigger>
          <TabsTrigger value="services" className="gap-1"><Package className="h-3.5 w-3.5" /> Service Catalog</TabsTrigger>
          <TabsTrigger value="audits" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Audit Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No UX projects found. Create one to get started.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProject(p)}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-xs">{UX_SERVICE_TYPES.find(s => s.value === p.service_type)?.label || p.service_type}</TableCell>
                      <TableCell>{p.package_tier ? <Badge variant="outline" className="text-[10px]">{p.package_tier}</Badge> : "—"}</TableCell>
                      <TableCell><Badge className={statusColors[p.status] || ""}>{p.status.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell>{p.budget ? `$${p.budget.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">UX Service Catalog — 15 Services</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {UX_SERVICE_TYPES.map(s => (
                  <div key={s.value} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-sm">{s.label}</p>
                    <p className="text-primary font-bold">{s.price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3">Bundled Packages</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {PACKAGES.map(pkg => (
                    <div key={pkg.value} className="rounded-lg border-2 border-primary/20 p-4">
                      <p className="font-bold">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pkg.services}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          {auditReports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No audit reports yet. AI-powered UX audits will appear here.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditReports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.analyzed_url || "—"}</TableCell>
                      <TableCell><Badge variant={r.overall_score >= 80 ? "default" : "destructive"}>{r.overall_score ?? "—"}/100</Badge></TableCell>
                      <TableCell><Badge>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <NewProjectDialog open={showNewProject} onOpenChange={setShowNewProject} onSubmit={(data: any) => createProject.mutate(data)} loading={createProject.isPending} />

      {/* Project Detail Dialog */}
      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          deliverables={deliverables}
          onClose={() => setSelectedProject(null)}
          onStatusChange={(status: string) => updateProject.mutate({ id: selectedProject.id, status })}
        />
      )}
    </div>
  );
}

function NewProjectDialog({ open, onOpenChange, onSubmit, loading }: any) {
  const [form, setForm] = useState({ title: "", service_type: "ux_audit", scope_description: "", budget: "", package_tier: "", client_id: "" });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
      package_tier: form.package_tier || null,
      client_id: form.client_id || "00000000-0000-0000-0000-000000000000",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New UX Consulting Project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Project Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UX_SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label} — {s.price}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.package_tier} onValueChange={v => setForm(f => ({ ...f, package_tier: v }))}>
            <SelectTrigger><SelectValue placeholder="Package (optional)" /></SelectTrigger>
            <SelectContent>{PACKAGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Budget ($)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
          <Textarea placeholder="Scope description..." value={form.scope_description} onChange={e => setForm(f => ({ ...f, scope_description: e.target.value }))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.title.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetailDialog({ project, deliverables, onClose, onStatusChange }: any) {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> {project.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Service:</span> {UX_SERVICE_TYPES.find(s => s.value === project.service_type)?.label}</div>
            <div><span className="text-muted-foreground">Budget:</span> {project.budget ? `$${project.budget}` : "—"}</div>
            <div><span className="text-muted-foreground">Package:</span> {project.package_tier || "None"}</div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <Select value={project.status} onValueChange={onStatusChange}>
                <SelectTrigger className="h-7 w-32 inline-flex"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {project.scope_description && (
            <div className="border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Scope</p>
              <p className="text-sm">{project.scope_description}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold mb-2">Deliverables ({deliverables.length})</h3>
            {deliverables.length === 0 ? (
              <p className="text-xs text-muted-foreground">No deliverables yet.</p>
            ) : (
              <div className="space-y-2">
                {deliverables.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between border rounded p-2 text-sm">
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.deliverable_type} — v{d.version}</p>
                    </div>
                    <Badge>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
