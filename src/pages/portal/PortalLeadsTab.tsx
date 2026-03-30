import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Download, Loader2 } from "lucide-react";

interface PortalLeadsTabProps {
  userId: string;
}

export default function PortalLeadsTab({ userId }: PortalLeadsTabProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("service_requests")
        .select("*")
        .eq("client_id", userId)
        .in("service_name", ["Lead Generation & Research", "AI Lead Discovery", "Targeted Business Outreach"])
        .order("created_at", { ascending: false });
      if (data) setRequests(data);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const exportCSV = () => {
    const csv = "Service,Status,Created,Due Date\n" + requests.map(r =>
      `"${r.service_name}","${r.status}","${new Date(r.created_at).toLocaleDateString()}","${r.due_date || "N/A"}"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lead-requests.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xl font-semibold">Lead Generation Requests</h2>
        {requests.length > 0 && <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> Export</Button>}
      </div>

      {requests.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p>No lead generation requests yet</p>
          </CardContent>
        </Card>
      ) : requests.map(req => (
        <Card key={req.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{req.service_name}</span>
              <Badge className={req.status === "completed" || req.status === "delivered" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>
                {req.client_visible_status || req.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
            {req.deliverable_url && (
              <a href={req.deliverable_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="mt-2"><Download className="mr-1 h-3 w-3" /> Download Results</Button>
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
