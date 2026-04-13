/**
 * Sprint 2: RON Dashboard
 * Real-time session overview with compliance checklist and revenue tracking.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Video, CheckCircle, Clock, DollarSign, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { format } from "date-fns";

const COMPLIANCE_CHECKLIST = [
  { id: "kba", label: "KBA Completed (2 attempts max per ORC §147.66)" },
  { id: "id_verify", label: "Government ID Verified" },
  { id: "recording", label: "Audio/Video Recording Active" },
  { id: "consent", label: "Recording Consent Obtained (ORC §147.63)" },
  { id: "seal", label: "Electronic Seal Applied" },
  { id: "journal", label: "Journal Entry Created (ORC §147.141)" },
  { id: "retention", label: "10-Year Retention Flagged" },
];

export default function AdminRonDashboard() {
  usePageMeta({ title: "RON Dashboard", noIndex: true });

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ["ron-dashboard-sessions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notarization_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const stats = {
    active: sessions.filter((s: any) => s.status === "active").length,
    scheduled: sessions.filter((s: any) => s.status === "scheduled").length,
    completed: sessions.filter((s: any) => s.status === "completed").length,
    revenue: sessions
      .filter((s: any) => s.status === "completed")
      .reduce((sum: number, s: any) => sum + (s.session_fee || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" /> RON Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Remote Online Notarization sessions & compliance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/20 p-2"><Clock className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-secondary p-2"><Clock className="h-4 w-4" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/20 p-2"><CheckCircle className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/20 p-2"><DollarSign className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Signer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KBA</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No RON sessions found</TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session: any) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-xs">{session.session_unique_id || session.id.slice(0, 8)}</TableCell>
                        <TableCell>{session.signer_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={session.status === "completed" ? "default" : session.status === "active" ? "outline" : "secondary"}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.kba_passed ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </TableCell>
                        <TableCell>${(session.session_fee || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(session.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                ORC §147 Post-Session Compliance Checklist
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                All items must be verified before a RON session can be marked complete.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {COMPLIANCE_CHECKLIST.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Fee calculation: (Acts × $30) + $10 tech fee per Ohio ORC §147.08/§147.63
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
