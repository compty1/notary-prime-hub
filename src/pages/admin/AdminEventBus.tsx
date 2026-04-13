import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Zap, Filter, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = ["appointment.created", "appointment.completed", "payment.received", "order.created", "order.fulfilled", "document.uploaded", "user.registered", "session.started", "session.completed"];

export default function AdminEventBus() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["platform-events", typeFilter],
    queryFn: async () => {
      let q = supabase.from("platform_events").select("*").order("created_at", { ascending: false }).limit(200);
      if (typeFilter !== "all") q = q.eq("event_type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const markProcessed = async (id: string) => {
    const { error } = await supabase.from("platform_events").update({ processed: true }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event marked processed" });
    refetch();
  };

  const filtered = events.filter((e: any) => !search || e.event_type?.includes(search) || e.entity_type?.includes(search));
  const unprocessed = events.filter((e: any) => !e.processed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Event Bus</h1>
          <p className="text-sm text-muted-foreground">Real-time platform event stream with processing status</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{events.length}</p><p className="text-xs text-muted-foreground">Total Events</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{unprocessed}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">{events.length - unprocessed}</p><p className="text-xs text-muted-foreground">Processed</p></div></div></CardContent></Card>
      </div>

      <div className="flex gap-3 items-center">
        <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Event Stream</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs font-mono">{format(new Date(e.created_at), "MMM d, HH:mm:ss")}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{e.event_type}</Badge></TableCell>
                    <TableCell className="text-xs">{e.entity_type ? `${e.entity_type}/${String(e.entity_id).slice(0, 8)}` : "—"}</TableCell>
                    <TableCell>{e.processed ? <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">Processed</Badge> : <Badge variant="secondary" className="text-xs">Pending</Badge>}</TableCell>
                    <TableCell>{!e.processed && <Button size="sm" variant="ghost" onClick={() => markProcessed(e.id)}>Mark Done</Button>}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No events found</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
