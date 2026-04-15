import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Clock, CheckCircle, AlertTriangle, Loader2, User, FileText, Upload, Download, PlusCircle, Globe } from "lucide-react";
import { logAuditEvent } from "@/lib/auditLog";
import { ExternalOrderDialog } from "@/components/ExternalOrderDialog";

const STATUS_OPTIONS = ["submitted", "in_progress", "awaiting_client", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  awaiting_client: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-primary/10 text-primary dark:text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-destructive/10 text-destructive",
};

export default function AdminServiceRequests() {
  usePageMeta({ title: "Service Requests", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editClientStatus, setEditClientStatus] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [externalOrderOpen, setExternalOrderOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
    fetchTeam();
    // Realtime subscription (Item 232)
    const channel = supabase.channel("admin-service-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setRequests(prev => [payload.new as Record<string, unknown>, ...prev]);
          toast({ title: "New service request", description: (payload.new as Record<string, unknown>).service_name });
        } else if (payload.eventType === "UPDATE") {
          setRequests(prev => prev.map(r => r.id === (payload.new as Record<string, unknown>).id ? payload.new as Record<string, unknown> : r));
        } else if (payload.eventType === "DELETE") {
          setRequests(prev => prev.filter(r => r.id !== (payload.old as Record<string, unknown>).id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTeam = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "notary"]);
    if (!roles) return;
    const userIds = [...new Set(roles.map(r => r.user_id))];
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
    setTeamProfiles(profs || []);
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false });
    if (data) {
      setRequests(data);
      const clientIds = [...new Set(data.map((r: any) => r.client_id))];
      if (clientIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", clientIds);
        if (profs) {
          const map: Record<string, any> = {};
          profs.forEach(p => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  const openDetail = (req: any) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditPriority(req.priority);
    setEditNotes(req.notes || "");
    setEditClientStatus(req.client_visible_status || "Submitted");
    setEditAssignedTo(req.assigned_to || "__unassigned__");
    setDeliverableFile(null);
    setDetailOpen(true);
  };

  const saveRequest = async () => {
    if (!selectedRequest) return;
    setUpdating(true);

    // Upload deliverable if file selected
    let deliverableUrl = selectedRequest.deliverable_url;
    if (deliverableFile) {
      setUploadingDeliverable(true);
      const filePath = `deliverables/${selectedRequest.id}/${Date.now()}_${deliverableFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(filePath, deliverableFile);
      if (!uploadErr) {
        const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(filePath, 60 * 60 * 24 * 365);
        deliverableUrl = urlData?.signedUrl || null;
      }
      setUploadingDeliverable(false);
    }

    // Auto-set SLA deadline when changing to in_progress
    let slaDeadline = selectedRequest.sla_deadline;
    if (editStatus === "in_progress" && selectedRequest.status !== "in_progress") {
      const now = new Date();
      const urgencyDays: Record<string, number> = { urgent: 1, high: 2, normal: 5, low: 7 };
      const days = urgencyDays[editPriority] || 5;
      now.setDate(now.getDate() + days);
      slaDeadline = now.toISOString();
    }

    const { error } = await supabase.from("service_requests").update({
      status: editStatus,
      priority: editPriority,
      notes: editNotes,
      client_visible_status: editClientStatus,
      assigned_to: editAssignedTo === "__unassigned__" ? null : editAssignedTo || null,
      deliverable_url: deliverableUrl || null,
      sla_deadline: slaDeadline,
    }).eq("id", selectedRequest.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      // Audit log (Item 247)
      await logAuditEvent("service_request_updated", {
        entityType: "service_request",
        entityId: selectedRequest.id,
        details: { status: editStatus, priority: editPriority, assigned_to: editAssignedTo === "__unassigned__" ? null : editAssignedTo || null },
      });
      toast({ title: "Request updated" });
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: editStatus, priority: editPriority, notes: editNotes, client_visible_status: editClientStatus, assigned_to: editAssignedTo === "__unassigned__" ? null : editAssignedTo || null, deliverable_url: deliverableUrl, sla_deadline: slaDeadline } : r));
      setDetailOpen(false);
    }
    setUpdating(false);
  };

  const filtered = requests.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    if (assignedFilter === "unassigned" && r.assigned_to) return false;
    if (assignedFilter !== "all" && assignedFilter !== "unassigned" && r.assigned_to !== assignedFilter) return false;
    if (platformFilter !== "all" && (r.source_platform || "notardex") !== platformFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const clientName = profiles[r.client_id]?.full_name?.toLowerCase() || "";
      return (r.service_name || "").toLowerCase().includes(s) || clientName.includes(s) || (r.reference_number || "").toLowerCase().includes(s) || r.id.includes(s);
    }
    return true;
  });

  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === "submitted").length,
    inProgress: requests.filter(r => r.status === "in_progress").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-2xl font-bold text-foreground">Service Requests</h2>
          <p className="text-sm text-muted-foreground">Manage all client service requests across categories</p>
        </div>
        <Button onClick={() => setExternalOrderOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" /> External Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-foreground" },
          { label: "New", value: stats.submitted, icon: AlertTriangle, color: "text-blue-500" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-yellow-500" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by service, client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {teamProfiles.map(p => (
              <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="notardex">Notar</SelectItem>
            <SelectItem value="fiverr">Fiverr</SelectItem>
            <SelectItem value="upwork">Upwork</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="thumbtack">Thumbtack</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">No service requests found.</CardContent></Card>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(req => (
                <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(req)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {req.service_name}
                      {req.source_platform && req.source_platform !== "notardex" && (
                        <Badge variant="outline" className="text-[10px] gap-1"><Globe className="h-3 w-3" />{req.source_platform}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{profiles[req.client_id]?.full_name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={statusColors[req.status] || ""}>{req.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={priorityColors[req.priority] || ""}>{req.priority}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                    {req.sla_deadline && new Date(req.sla_deadline) < new Date() && req.status !== "completed" && req.status !== "cancelled" && (
                      <Badge className="ml-2 bg-destructive/10 text-destructive text-[10px]">Overdue</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.service_name}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client: {profiles[selectedRequest.client_id]?.full_name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">Email: {profiles[selectedRequest.client_id]?.email || "—"}</p>
                <p className="text-sm text-muted-foreground">Submitted: {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              {selectedRequest.intake_data && Object.keys(selectedRequest.intake_data).length > 0 && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium mb-2">Intake Data</p>
                  {Object.entries(selectedRequest.intake_data).map(([key, val]) => (
                    <p key={key} className="text-sm"><span className="text-muted-foreground">{key}:</span> {String(val)}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Client-Visible Status</Label>
                <Select value={editClientStatus} onValueChange={setEditClientStatus}>
                  <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                  <SelectContent>
                    {["Submitted", "In Review", "In Progress", "Awaiting Your Input", "Ready for Pickup", "Completed", "On Hold", "Cancelled"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Admin Notes</Label>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} />
              </div>

              <div>
                <Label>Assign To</Label>
                <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {teamProfiles.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Upload Deliverable</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="file" onChange={e => setDeliverableFile(e.target.files?.[0] || null)} className="text-sm" />
                  {selectedRequest?.deliverable_url && (
                    <a href={selectedRequest.deliverable_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline"><Download className="mr-1 h-3 w-3" /> Current</Button>
                    </a>
                  )}
                </div>
              </div>

              {selectedRequest?.sla_deadline && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">SLA Deadline: {new Date(selectedRequest.sla_deadline).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
            <Button onClick={saveRequest} disabled={updating}>{updating ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExternalOrderDialog
        open={externalOrderOpen}
        onOpenChange={setExternalOrderOpen}
        onCreated={fetchRequests}
      />
    </div>
  );
}
