import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, Search, Calendar, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

export default function AdminMediation() {
  usePageMeta({ title: "Mediation & ADR | Admin", noIndex: true });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: sessions = [] } = useQuery({
    queryKey: ["mediation-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("*")
        .or("service_name.ilike.%mediation%,service_name.ilike.%adr%,service_name.ilike.%arbitration%")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = sessions.filter((s: any) =>
    (statusFilter === "all" || s.status === statusFilter) &&
    (!search || JSON.stringify(s).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardEnhancer category="mediation">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="h-6 w-6 text-primary" /> Mediation & ADR</h1>
        <p className="text-sm text-muted-foreground mt-1">Alternative dispute resolution scheduling and document support</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-primary" /><div className="text-xl font-bold">{sessions.length}</div><p className="text-xs text-muted-foreground">Total Sessions</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" /><div className="text-xl font-bold">{sessions.filter((s: any) => s.status === "pending").length}</div><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Scale className="h-5 w-5 mx-auto mb-1 text-amber-500" /><div className="text-xl font-bold">{sessions.filter((s: any) => s.status === "in_progress").length}</div><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="h-5 w-5 mx-auto mb-1 text-green-500" /><div className="text-xl font-bold">{sessions.filter((s: any) => s.status === "completed").length}</div><p className="text-xs text-muted-foreground">Resolved</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No mediation sessions found</TableCell></TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.reference_number}</TableCell>
                  <TableCell>{s.service_name}</TableCell>
                  <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardEnhancer>
  );
}
