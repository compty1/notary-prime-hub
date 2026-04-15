/**
 * WFL-002/DASH-001: Unified Operations Dashboard
 * Shows all open jobs grouped by service and status with filters and quick actions.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, AlertTriangle, CheckCircle, Clock, Filter, Zap } from "lucide-react";
import { WorkflowAutomationRules } from "@/components/WorkflowAutomationRules";
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700",
  in_progress: "bg-yellow-500/10 text-yellow-700",
  completed: "bg-green-500/10 text-green-700",
  cancelled: "bg-red-500/10 text-red-700",
  pending: "bg-orange-500/10 text-orange-700",
  notarized: "bg-emerald-500/10 text-emerald-700",
};

export default function AdminOperations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: appointments, isLoading: loadingAppts, refetch: refetchAppts } = useQuery({
    queryKey: ["ops-appointments", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, service_type, status, scheduled_date, scheduled_time, client_id, confirmation_number, notarization_type")
        .order("scheduled_date", { ascending: true })
        .limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "cancelled" | "completed" | "confirmed" | "scheduled");
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: serviceRequests, isLoading: loadingSR } = useQuery({
    queryKey: ["ops-service-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, service_name, status, priority, created_at, reference_number")
        .neq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: webhookIssues } = useQuery({
    queryKey: ["ops-webhook-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("id, source, event_type, status, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredAppts = (appointments || []).filter(a =>
    !search || a.service_type?.toLowerCase().includes(search.toLowerCase()) ||
    a.confirmation_number?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByService = filteredAppts.reduce((acc, a) => {
    const key = a.service_type || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, typeof filteredAppts>);

  const openCount = (appointments || []).filter(a => !["completed", "cancelled", "no_show", "notarized"].includes(a.status)).length;
  const issueCount = (webhookIssues || []).length + (serviceRequests || []).filter(r => r.priority === "urgent").length;

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Operations Center</h1>
            <p className="text-sm text-muted-foreground">All open jobs, service requests, and data issues</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> {openCount} Open
            </Badge>
            {issueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {issueCount} Issues
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => refetchAppts()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by service or confirmation #"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="appointments">
          <TabsList>
            <TabsTrigger value="appointments">Appointments ({filteredAppts.length})</TabsTrigger>
            <TabsTrigger value="requests">Service Requests ({(serviceRequests || []).length})</TabsTrigger>
            <TabsTrigger value="issues">Data Issues ({issueCount})</TabsTrigger>
            <TabsTrigger value="automation"><Zap className="h-3 w-3 mr-1" />Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            {loadingAppts ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : Object.keys(groupedByService).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No appointments match your filters</CardContent></Card>
            ) : (
              Object.entries(groupedByService).map(([service, items]) => (
                <Card key={service}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {service}
                      <Badge variant="secondary">{items.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {items.slice(0, 10).map(item => (
                        <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              {item.confirmation_number || item.id.slice(0, 8)}
                            </span>
                            <span>{item.scheduled_date} @ {item.scheduled_time}</span>
                          </div>
                          <Badge className={STATUS_COLORS[item.status] || ""} variant="outline">
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-2">
            {loadingSR ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (serviceRequests || []).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No open service requests</CardContent></Card>
            ) : (
              (serviceRequests || []).map(sr => (
                <Card key={sr.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{sr.service_name}</p>
                      <p className="text-xs text-muted-foreground">{sr.reference_number}</p>
                    </div>
                    <div className="flex gap-2">
                      {sr.priority === "urgent" && <Badge variant="destructive">Urgent</Badge>}
                      <Badge variant="outline">{sr.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-2">
            {(webhookIssues || []).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No data issues detected
                </CardContent>
              </Card>
            ) : (
              (webhookIssues || []).map(issue => (
                <Card key={issue.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{issue.event_type}</p>
                      <p className="text-xs text-muted-foreground">Source: {issue.source}</p>
                    </div>
                    <Badge variant="destructive">{issue.status}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* WA-001: Wire workflow automation rules into operations center */}
          <TabsContent value="automation" className="space-y-4">
            <WorkflowAutomationRules />
          </TabsContent>
        </Tabs>
      </div>
  );
}
