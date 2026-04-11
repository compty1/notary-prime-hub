import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Clock, CheckCircle, AlertTriangle, Download, Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  submitted: "bg-info/10 text-info",
  in_progress: "bg-warning/10 text-warning-foreground",
  awaiting_client: "bg-accent/10 text-accent-foreground",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, any> = {
  submitted: AlertTriangle,
  in_progress: Clock,
  completed: CheckCircle,
};

const STATUS_OPTIONS = ["all", "submitted", "in_progress", "awaiting_client", "completed", "cancelled"];

interface Props {
  serviceRequests: any[];
}

export default function PortalServiceRequestsTab({ serviceRequests: initialRequests }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [requests, setRequests] = useState(initialRequests);

  // Sync with parent prop
  useEffect(() => { setRequests(initialRequests); }, [initialRequests]);

  // Realtime subscription for service_requests updates
  useEffect(() => {
    const channel = supabase
      .channel("portal-service-requests")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests" }, (payload) => {
        const updated = payload.new as any;
        setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = requests
    .filter(r => statusFilter === "all" || r.status === statusFilter)
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.service_name?.toLowerCase().includes(q) ||
        r.reference_number?.toLowerCase().includes(q)
      );
    });

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const isSlaUrgent = (req: any) => {
    if (!req.sla_deadline) return false;
    const hoursLeft = (new Date(req.sla_deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft < 24;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search service requests"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Awaiting client action banner */}
      {requests.some(r => r.status === "awaiting_client") && statusFilter !== "awaiting_client" && (
        <button
          onClick={() => setStatusFilter("awaiting_client")}
          className="w-full flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-2 text-sm text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{requests.filter(r => r.status === "awaiting_client").length} request(s) need your input</span>
        </button>
      )}

      {filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-foreground">No service requests found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== "all" ? "Try changing the filter." : "When you submit a service request, it will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const Icon = statusIcons[req.status] || FileText;
            const expanded = expandedId === req.id;
            const urgent = isSlaUrgent(req);
            return (
              <Card key={req.id} className={`border-border/50 ${urgent ? "ring-1 ring-destructive/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{req.service_name}</p>
                          {req.reference_number && (
                            <span className="text-xs text-muted-foreground font-mono">{req.reference_number}</span>
                          )}
                          {urgent && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgent</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Submitted {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          <span className="ml-2 text-xs">({getTimeSince(req.created_at)})</span>
                        </p>
                        {req.client_visible_status && req.client_visible_status !== "Submitted" && (
                          <p className="text-sm text-primary mt-1">Status: {req.client_visible_status}</p>
                        )}

                        {/* Progress timeline */}
                        <div className="mt-2">
                          <ProgressTimeline status={req.status} type="service_request" />
                        </div>

                        {req.deliverable_url && (
                          <a href={req.deliverable_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                            <Download className="h-3 w-3" /> Download Deliverable
                          </a>
                        )}
                        {req.sla_deadline && (
                          <p className={`text-xs mt-1 ${urgent ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            ETA: {new Date(req.sla_deadline).toLocaleDateString()}
                            {urgent && " — Due within 24 hours"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>
                        {req.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                      {req.intake_data && Object.keys(req.intake_data).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setExpandedId(expanded ? null : req.id)}
                          aria-expanded={expanded}
                          aria-label={expanded ? "Hide details" : "Show details"}
                        >
                          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expandable intake data */}
                  {expanded && req.intake_data && Object.keys(req.intake_data).length > 0 && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 animate-in slide-in-from-top-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Request Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {Object.entries(req.intake_data).map(([key, val]) => (
                          <p key={key} className="text-xs text-muted-foreground">
                            <span className="capitalize font-medium">{key.replace(/_/g, " ")}:</span>{" "}
                            {String(val)}
                          </p>
                        ))}
                      </div>
                      {req.notes && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground">Notes</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{req.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reorder action for completed */}
                  {req.status === "completed" && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <a href={`/request?service=${encodeURIComponent(req.service_name)}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <RefreshCw className="mr-1 h-3 w-3" /> Request Similar
                        </Button>
                      </a>
                    </div>
                  )}
                  {/* ID 418: Client cancellation for pending requests */}
                  {(req.status === "submitted" || req.status === "in_progress") && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => setCancelRequestId(req.id)}
                      >
                        Cancel Request
                      </Button>
                      <span className="text-[10px] text-muted-foreground">You can cancel before work begins.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AlertDialog open={!!cancelRequestId} onOpenChange={(open) => { if (!open) setCancelRequestId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to cancel this request? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!cancelRequestId) return;
              const { error } = await supabase.from("service_requests").update({ status: "cancelled" }).eq("id", cancelRequestId);
              if (!error) setRequests(prev => prev.map(r => r.id === cancelRequestId ? { ...r, status: "cancelled" } : r));
              setCancelRequestId(null);
            }}>Cancel Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
