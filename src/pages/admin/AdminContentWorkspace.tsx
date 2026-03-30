import { usePageTitle } from "@/lib/usePageTitle";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, Send, Loader2, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  delivered: "bg-primary/10 text-primary",
};

export default function AdminContentWorkspace() {
  usePageTitle("Content Workspace");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const contentServices = ["Blog & Article Writing", "Social Media Content", "Email Campaign Creation", "SEO Content Optimization", "Content Creation & Copywriting"];

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("service_requests").select("*, profiles!service_requests_client_id_fkey(full_name, email)").in("service_name", contentServices).order("created_at", { ascending: false });
      if (data) setRequests(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sans text-2xl font-bold">Content Workspace</h1>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Queue</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" /><p>No content requests</p></CardContent></Card>
        ) : filtered.map(req => (
          <Card key={req.id} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{req.service_name}</span>
                  <Badge className={STATUS_COLORS[req.status] || "bg-muted text-muted-foreground"}>{req.status.replace(/_/g, " ")}</Badge>
                  {req.priority !== "normal" && <Badge variant="destructive" className="text-xs">{req.priority}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Client: {(req as any).profiles?.full_name || "Unknown"} • {new Date(req.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                {req.status === "submitted" && (
                  <Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from("service_requests").update({ status: "in_progress", client_visible_status: "In Progress" }).eq("id", req.id);
                    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "in_progress" } : r));
                  }}><Clock className="mr-1 h-3 w-3" /> Start</Button>
                )}
                {req.status === "in_progress" && (
                  <Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from("service_requests").update({ status: "completed", client_visible_status: "Completed" }).eq("id", req.id);
                    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "completed" } : r));
                  }}><CheckCircle className="mr-1 h-3 w-3" /> Complete</Button>
                )}
                {req.status === "completed" && (
                  <Button size="sm" onClick={async () => {
                    await supabase.from("service_requests").update({ status: "delivered", client_visible_status: "Delivered" }).eq("id", req.id);
                    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "delivered" } : r));
                  }}><Send className="mr-1 h-3 w-3" /> Deliver</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
