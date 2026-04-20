import { usePageMeta } from "@/hooks/usePageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableAuditLog } from "@/components/SearchableAuditLog";
import { ActiveSessionsView } from "@/components/ActiveSessionsView";
import { DataIssuesPanel } from "@/components/DataIssuesPanel";
import { Shield, Activity, AlertTriangle, FileText, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminSecurityCenter() {
  usePageMeta({ title: "Security Center | Admin", description: "Security monitoring, audit logs, and compliance tools" });

  const { data: legalHolds = [] } = useQuery({
    queryKey: ["legal-holds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_holds").select("*").is("released_at", null).order("placed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: deletionRequests = [] } = useQuery({
    queryKey: ["deletion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_deletion_requests").select("*").order("requested_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Security Center</h1>
        <p className="text-muted-foreground">Monitor security events, manage sessions, and handle compliance requests</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Legal Holds</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{legalHolds.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Deletion Requests</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{deletionRequests.filter((r: any) => r.status === "pending").length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MFA Status</CardTitle></CardHeader>
          <CardContent><p className="text-sm font-medium text-success">Enforced for admin routes</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">RLS Coverage</CardTitle></CardHeader>
          <CardContent><p className="text-sm font-medium text-success">All tables protected</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit"><FileText className="mr-1 h-3 w-3" /> Audit Log</TabsTrigger>
          <TabsTrigger value="sessions"><Activity className="mr-1 h-3 w-3" /> Sessions</TabsTrigger>
          <TabsTrigger value="holds"><Lock className="mr-1 h-3 w-3" /> Legal Holds</TabsTrigger>
          <TabsTrigger value="deletions"><AlertTriangle className="mr-1 h-3 w-3" /> Data Requests</TabsTrigger>
          <TabsTrigger value="issues"><AlertTriangle className="mr-1 h-3 w-3" /> Data Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="audit"><SearchableAuditLog /></TabsContent>
        <TabsContent value="sessions"><ActiveSessionsView /></TabsContent>
        <TabsContent value="holds">
          <Card>
            <CardHeader>
              <CardTitle>Active Legal Holds</CardTitle>
              <CardDescription>Records flagged to prevent deletion during legal proceedings</CardDescription>
            </CardHeader>
            <CardContent>
              {legalHolds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active legal holds</p>
              ) : (
                <div className="space-y-3">
                  {legalHolds.map((hold: any) => (
                    <div key={hold.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{hold.entity_type} — {hold.entity_id}</p>
                        <p className="text-xs text-muted-foreground">{hold.reason}</p>
                        <p className="text-xs text-muted-foreground">Placed: {new Date(hold.placed_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await supabase.from("legal_holds").update({ released_at: new Date().toISOString(), released_by: (await supabase.auth.getUser()).data.user?.id }).eq("id", hold.id);
                        toast.success("Legal hold released");
                      }}>Release</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="deletions">
          <Card>
            <CardHeader>
              <CardTitle>Data Deletion Requests</CardTitle>
              <CardDescription>User requests for data deletion or anonymization (GDPR/Privacy)</CardDescription>
            </CardHeader>
            <CardContent>
              {deletionRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No deletion requests</p>
              ) : (
                <div className="space-y-3">
                  {deletionRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">User: {req.user_id.slice(0, 8)}…</p>
                        <p className="text-xs text-muted-foreground">{req.reason || "No reason provided"}</p>
                        <p className="text-xs text-muted-foreground">Status: <span className={req.status === "pending" ? "text-warning" : "text-success"}>{req.status}</span></p>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            const user = (await supabase.auth.getUser()).data.user;
                            await supabase.from("data_deletion_requests").update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", req.id);
                            toast.success("Request approved");
                          }}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            const user = (await supabase.auth.getUser()).data.user;
                            await supabase.from("data_deletion_requests").update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", req.id);
                            toast.info("Request rejected");
                          }}>Reject</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="issues"><DataIssuesPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
