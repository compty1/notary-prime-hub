import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, AlertCircle, CheckCircle2, Webhook, Plus, Trash2, Copy, Send } from "lucide-react";

const AVAILABLE_EVENTS = [
  "appointment.created", "appointment.completed", "appointment.cancelled",
  "payment.received", "payment.refunded",
  "session.started", "session.completed",
  "document.uploaded", "document.notarized",
  "lead.created", "lead.converted",
];

function InboundTab() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    const query = supabase.from("webhook_events").select("*").order("created_at", { ascending: false }).limit(100);
    if (sourceFilter !== "all") query.eq("source", sourceFilter);
    query.then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, [sourceFilter]);

  const statusColor = (status: string) => {
    switch (status) {
      case "processed": return "default";
      case "received": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="signnow">SignNow</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : events.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Webhook className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p>No webhook events recorded yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {event.status === "processed" ? <CheckCircle2 className="h-5 w-5 text-success" /> : event.status === "failed" ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Webhook className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{event.event_type}</span>
                      <Badge variant="outline" className="text-xs">{event.source}</Badge>
                      <Badge variant={statusColor(event.status)} className="text-xs">{event.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                      {event.error && <span className="text-destructive ml-2">Error: {event.error}</span>}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </CardContent>
              {selectedEvent?.id === event.id && (
                <CardContent className="border-t p-4">
                  <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OutboundTab() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [whRes, logRes] = await Promise.all([
      supabase.from("outbound_webhooks").select("*").order("created_at", { ascending: false }),
      supabase.from("outbound_webhook_log").select("*").order("attempted_at", { ascending: false }).limit(50),
    ]);
    setWebhooks(whRes.data || []);
    setLogs(logRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createWebhook = async () => {
    if (!newUrl.trim() || newEvents.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("outbound_webhooks").insert({
      url: newUrl.trim(), events_subscribed: newEvents, description: newDesc.trim() || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Created", description: "Webhook subscription registered." }); setDialogOpen(false); setNewUrl(""); setNewDesc(""); setNewEvents([]); fetchData(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("outbound_webhooks").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("outbound_webhooks").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchData();
  };

  const toggleEvent = (evt: string) => {
    setNewEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt]);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Register URLs to receive real-time event notifications from NotarDex.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Webhook</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Register Outbound Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Endpoint URL</Label><Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com/webhook" /></div>
              <div><Label>Description (optional)</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Title company integration" /></div>
              <div>
                <Label>Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map(evt => (
                    <label key={evt} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={newEvents.includes(evt)} onChange={() => toggleEvent(evt)} className="rounded" />
                      {evt}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={createWebhook} disabled={saving || !newUrl.trim() || newEvents.length === 0} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Register Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Webhook className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p>No outbound webhooks registered.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={wh.is_active ? "default" : "secondary"}>{wh.is_active ? "Active" : "Inactive"}</Badge>
                      {wh.description && <span className="text-sm font-medium">{wh.description}</span>}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(wh.events_subscribed || []).map((e: string) => (
                        <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                      ))}
                    </div>
                    {wh.last_triggered_at && <p className="text-xs text-muted-foreground">Last triggered: {new Date(wh.last_triggered_at).toLocaleString()}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(wh.secret); toast({ title: "Copied", description: "HMAC secret copied to clipboard." }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Switch checked={wh.is_active} onCheckedChange={() => toggleActive(wh.id, wh.is_active)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {selectedWebhook === wh.id && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs font-medium mb-2">Recent Deliveries</p>
                    {logs.filter(l => l.webhook_id === wh.id).slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center gap-2 text-xs py-1">
                        <Badge variant={l.response_status && l.response_status < 400 ? "default" : "destructive"} className="text-[10px]">
                          {l.response_status || "N/A"}
                        </Badge>
                        <span>{l.event_type}</span>
                        <span className="text-muted-foreground">{new Date(l.attempted_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="link" size="sm" className="mt-1 p-0 h-auto text-xs" onClick={() => setSelectedWebhook(selectedWebhook === wh.id ? null : wh.id)}>
                  {selectedWebhook === wh.id ? "Hide logs" : "Show delivery logs"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminWebhooks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Webhook className="h-6 w-6" /> Webhook Events
        </h1>
        <p className="text-muted-foreground text-sm">Monitor incoming webhooks and manage outbound event subscriptions</p>
      </div>

      <Tabs defaultValue="inbound" className="w-full">
        <TabsList>
          <TabsTrigger value="inbound">Inbound</TabsTrigger>
          <TabsTrigger value="outbound">Outbound</TabsTrigger>
        </TabsList>
        <TabsContent value="inbound" className="mt-4"><InboundTab /></TabsContent>
        <TabsContent value="outbound" className="mt-4"><OutboundTab /></TabsContent>
      </Tabs>
    </div>
  );
}
