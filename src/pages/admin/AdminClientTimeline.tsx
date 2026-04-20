import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Calendar, FileText, DollarSign, Activity, Search } from "lucide-react";
import { format } from "date-fns";

const EVENT_ICONS: Record<string, any> = {
  appointment: Calendar,
  payment: DollarSign,
  document: FileText,
  communication: Activity,
  default: Clock,
};

const EVENT_COLORS: Record<string, string> = {
  appointment: "bg-blue-500",
  payment: "bg-emerald-500",
  document: "bg-purple-500",
  communication: "bg-amber-500",
  default: "bg-gray-500",
};

export default function AdminClientTimeline() {
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState("all");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-timeline", clientSearch],
    queryFn: async () => {
      let q = supabase.from("profiles").select("user_id, full_name, email").limit(50);
      if (clientSearch) q = q.or(`full_name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["client-timeline", selectedClient, eventFilter],
    queryFn: async () => {
      if (!selectedClient) return [];
      let q = supabase.from("client_timeline_events").select("*").eq("client_id", selectedClient).order("created_at", { ascending: false }).limit(100);
      if (eventFilter !== "all") q = q.eq("event_type", eventFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  // Also pull from appointments and payments for a unified view
  const { data: appointments = [] } = useQuery({
    queryKey: ["client-appts", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase.from("appointments").select("id, scheduled_date, scheduled_time, service_type, status, created_at").eq("client_id", selectedClient).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["client-payments", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase.from("payments").select("id, amount, status, method, created_at").eq("client_id", selectedClient).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!selectedClient,
  });

  // Merge into unified timeline
  const unified = [
    ...timeline.map((t: any) => ({ ...t, source: "timeline" })),
    ...appointments.map((a: any) => ({ id: a.id, event_type: "appointment", title: `${a.service_type} — ${a.status}`, description: `${a.scheduled_date} at ${a.scheduled_time}`, created_at: a.created_at, source: "appointment" })),
    ...payments.map((p: any) => ({ id: p.id, event_type: "payment", title: `$${p.amount} — ${p.status}`, description: `Via ${p.method || "unknown"}`, created_at: p.created_at, source: "payment" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredTimeline = eventFilter === "all" ? unified : unified.filter(e => e.event_type === eventFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Client Activity Timeline</h1>
        <p className="text-sm text-muted-foreground">Unified activity feed per client — appointments, payments, documents, and communications</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
        </div>
        <Select value={selectedClient || ""} onValueChange={v => setSelectedClient(v)}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select a client" /></SelectTrigger>
          <SelectContent>
            {clients.map((c: any) => <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || c.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="appointment">Appointments</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="communication">Communications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!selectedClient ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><User className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Select a client to view their activity timeline</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : filteredTimeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity found for this client</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                  {filteredTimeline.map((event: any) => {
                    const Icon = EVENT_ICONS[event.event_type] || EVENT_ICONS.default;
                    const color = EVENT_COLORS[event.event_type] || EVENT_COLORS.default;
                    return (
                      <div key={event.id} className="relative flex items-start gap-3">
                        <div className={`absolute -left-4 w-4 h-4 rounded-full ${color} flex items-center justify-center`}>
                          <Icon className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 ml-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{event.title}</span>
                            <Badge variant="outline" className="text-[10px]">{event.event_type}</Badge>
                          </div>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
