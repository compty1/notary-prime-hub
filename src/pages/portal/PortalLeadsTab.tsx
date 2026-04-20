import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Download, Loader2, Users, TrendingUp } from "lucide-react";

interface PortalLeadsTabProps {
  userId: string;
}

export default function PortalLeadsTab({ userId }: PortalLeadsTabProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "requests">("leads");

  useEffect(() => {
    const load = async () => {
      // REM-036: Fetch actual leads referred by this business user
      const [leadsRes, requestsRes] = await Promise.all([
        supabase.from("leads").select("*").or(`source.eq.referral,source.eq.business_portal`).order("created_at", { ascending: false }).limit(50),
        supabase.from("service_requests").select("*").eq("client_id", userId).in("service_name", ["Lead Generation & Research", "AI Lead Discovery", "Targeted Business Outreach"]).order("created_at", { ascending: false }),
      ]);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (requestsRes.data) setRequests(requestsRes.data);
      setLoading(false);
    };
    load();
  }, [userId]);

  const exportCSV = () => {
    const items = activeTab === "leads" ? leads : requests;
    const csv = activeTab === "leads"
      ? "Business Name,Status,Source,City,Created\n" + items.map(l => `"${l.business_name || ""}","${l.status}","${l.source || ""}","${l.city || ""}","${new Date(l.created_at).toLocaleDateString()}"`).join("\n")
      : "Service,Status,Created,Due Date\n" + items.map(r => `"${r.service_name}","${r.status}","${new Date(r.created_at).toLocaleDateString()}","${r.due_date || "N/A"}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeTab}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const items = activeTab === "leads" ? leads : requests;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xl font-semibold">Leads & Referrals</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> Export</Button>}
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button onClick={() => setActiveTab("leads")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "leads" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Users className="mr-1 inline h-3.5 w-3.5" /> Leads ({leads.length})
        </button>
        <button onClick={() => setActiveTab("requests")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "requests" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> Requests ({requests.length})
        </button>
      </div>

      {items.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p>No {activeTab === "leads" ? "leads" : "lead generation requests"} yet</p>
          </CardContent>
        </Card>
      ) : activeTab === "leads" ? (
        leads.map(lead => (
          <Card key={lead.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{lead.business_name || lead.contact_name || "Unknown"}</span>
                <Badge className={lead.status === "converted" ? "bg-primary/10 text-primary" : lead.status === "contacted" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}>
                  {lead.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {lead.city && <span>{lead.city}, {lead.state || "OH"}</span>}
                {lead.service_needed && <span>• {lead.service_needed}</span>}
                <span>• {new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        requests.map(req => (
          <Card key={req.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{req.service_name}</span>
                <Badge className={req.status === "completed" || req.status === "delivered" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "bg-warning/10 text-warning"}>
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
        ))
      )}
    </div>
  );
}
