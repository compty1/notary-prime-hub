import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, AlertCircle, CheckCircle2, Webhook } from "lucide-react";

export default function AdminWebhooks() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const query = supabase
      .from("webhook_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (sourceFilter !== "all") {
      query.eq("source", sourceFilter);
    }

    query.then(({ data }) => {
      setEvents(data || []);
      setLoading(false);
    });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Webhook className="h-6 w-6" /> Webhook Events
          </h1>
          <p className="text-muted-foreground text-sm">Monitor incoming webhooks from integrated services</p>
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
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
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Webhook className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p>No webhook events recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {event.status === "processed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : event.status === "failed" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Webhook className="h-5 w-5 text-muted-foreground" />
                  )}
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
