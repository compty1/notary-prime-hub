import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, Clock, ArrowRight } from "lucide-react";

export default function AdminTaskQueue() {
  usePageMeta({ title: "Task Queue", noIndex: true });
  const [requests, setRequests] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  const taskServices = [
    "Data Entry & Processing", "Administrative Support", "Clerical Document Preparation",
    "Document Cleanup & Formatting", "Form Filling Assistance", "Background Check Coordination",
  ];

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("service_requests").select("*, profiles!service_requests_client_id_fkey(full_name)").in("service_name", taskServices).order("created_at", { ascending: false });
      if (data) setRequests(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const columns = {
    submitted: requests.filter(r => r.status === "submitted"),
    in_progress: requests.filter(r => r.status === "in_progress"),
    completed: requests.filter(r => ["completed", "delivered"].includes(r.status)),
  };

  const moveStatus = async (id: string, newStatus: string, visibleStatus: string) => {
    await supabase.from("service_requests").update({ status: newStatus, client_visible_status: visibleStatus }).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, client_visible_status: visibleStatus } : r));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sans text-2xl font-bold">Task Queue</h1>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["submitted", "in_progress", "completed"] as const).map(col => (
          <div key={col}>
            <div className="flex items-center gap-2 mb-3">
              {col === "submitted" && <Clock className="h-4 w-4 text-warning" />}
              {col === "in_progress" && <ArrowRight className="h-4 w-4 text-info" />}
              {col === "completed" && <CheckCircle className="h-4 w-4 text-primary" />}
              <h3 className="font-sans text-sm font-semibold capitalize">{col.replace(/_/g, " ")}</h3>
              <Badge variant="secondary" className="text-xs">{columns[col].length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {columns[col].map(req => (
                <Card key={req.id} className="border-border/50">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium mb-1">{req.service_name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{req.profiles?.full_name || "Unknown"}</p>
                    {req.priority !== "normal" && <Badge variant="destructive" className="text-xs mb-2">{req.priority}</Badge>}
                    {col === "submitted" && <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => moveStatus(req.id, "in_progress", "In Progress")}>Start</Button>}
                    {col === "in_progress" && <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => moveStatus(req.id, "completed", "Completed")}>Complete</Button>}
                  </CardContent>
                </Card>
              ))}
              {columns[col].length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Empty</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
