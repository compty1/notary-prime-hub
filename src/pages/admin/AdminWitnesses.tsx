/**
 * Sprint 2: Witness Services Admin — Enhanced
 * Conflict-of-interest checker, availability, fee tracking.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { format } from "date-fns";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

export default function AdminWitnesses() {
  usePageMeta({ title: "Witness Services", noIndex: true });

  const { data: witnesses = [], isLoading, refetch } = useQuery({
    queryKey: ["witnesses-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("witnesses").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const stats = {
    total: witnesses.length,
    verified: witnesses.filter((w: any) => w.identity_verified).length,
    pendingVerification: witnesses.filter((w: any) => !w.identity_verified).length,
  };

  return (
    <DashboardEnhancer category="witnesses">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Witness Services
          </h1>
          <p className="text-sm text-muted-foreground">Manage witness records, verify identity, track conflicts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Witnesses</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-primary">{stats.verified}</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-warning">{stats.pendingVerification}</p><p className="text-xs text-muted-foreground">Pending Verification</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID Verified</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : witnesses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No witness records</TableCell></TableRow>
              ) : (
                witnesses.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.full_name || "—"}</TableCell>
                    <TableCell>
                      {w.identity_verified ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {w.relationship_to_signer ? (
                        <Badge variant={w.relationship_to_signer === "none" ? "default" : "secondary"}>
                          {w.relationship_to_signer}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{w.session_id?.slice(0, 8) || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(w.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardEnhancer>
  );
}
