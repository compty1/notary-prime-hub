import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, AlertTriangle, CheckCircle, Truck, Timer } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  en_route: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  arrived: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground", normal: "text-foreground", high: "text-orange-600", urgent: "text-red-600 font-bold",
};

export default function AdminDispatch() {
  usePageMeta({ title: "Dispatch & Routing" });
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: dispatches = [] } = useQuery({
    queryKey: ["dispatch_assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("dispatch_assignments").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: slaTimers = [] } = useQuery({
    queryKey: ["sla_timers"],
    queryFn: async () => {
      const { data } = await supabase.from("sla_timers").select("*").order("deadline_at", { ascending: true }).limit(50);
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { dispatch_status: status };
      if (status === "dispatched") updates.dispatched_at = new Date().toISOString();
      const { error } = await supabase.from("dispatch_assignments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dispatch_assignments"] }); toast.success("Status updated"); },
  });

  const filtered = statusFilter === "all" ? dispatches : dispatches.filter(d => d.dispatch_status === statusFilter);
  const activeCount = dispatches.filter(d => ["dispatched", "en_route", "arrived"].includes(d.dispatch_status)).length;
  const urgentCount = dispatches.filter(d => d.priority === "urgent" && d.dispatch_status !== "completed").length;
  const breachedSLAs = slaTimers.filter(s => s.breached).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dispatch & Routing Engine</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Dispatches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-1"><Truck className="h-5 w-5 text-blue-600" />{activeCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{dispatches.filter(d => d.dispatch_status === "pending").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Urgent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-5 w-5" />{urgentCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">SLA Breaches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">{breachedSLAs}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="dispatches">
        <TabsList>
          <TabsTrigger value="dispatches"><Truck className="h-3.5 w-3.5 mr-1" />Dispatches</TabsTrigger>
          <TabsTrigger value="sla"><Timer className="h-3.5 w-3.5 mr-1" />SLA Timers</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatches" className="space-y-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>

          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No dispatch assignments found.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(d => (
                <Card key={d.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Dispatch #{d.id.slice(0, 8)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={PRIORITY_COLORS[d.priority] || ""}>{d.priority.toUpperCase()}</span>
                          {d.eta_minutes && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />ETA: {d.eta_minutes}m</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[d.dispatch_status] || ""}>{d.dispatch_status.replace(/_/g, " ")}</Badge>
                      {d.dispatch_status !== "completed" && d.dispatch_status !== "cancelled" && (
                        <Select value={d.dispatch_status} onValueChange={v => updateStatus.mutate({ id: d.id, status: v })}>
                          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          {slaTimers.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No SLA timers configured.</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left p-3">Type</th><th className="text-left p-3">Entity</th><th className="text-left p-3">Deadline</th><th className="text-center p-3">Status</th></tr></thead>
                <tbody>{slaTimers.map(s => (
                  <tr key={s.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{s.sla_type}</td>
                    <td className="p-3 text-muted-foreground">{s.entity_type} #{s.entity_id.slice(0, 8)}</td>
                    <td className="p-3">{new Date(s.deadline_at).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {s.breached ? <Badge variant="destructive">Breached</Badge> : s.met_at ? <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Met</Badge> : <Badge variant="outline">Active</Badge>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
