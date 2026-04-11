import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Building2 } from "lucide-react";

const statusColors: Record<string, string> = { pending: "secondary", submitted: "default", approved: "default", rejected: "destructive" };

export default function AdminSOSFilings() {
  usePageMeta({ title: "SOS Filings", noIndex: true });
  const [filter, setFilter] = useState("all");

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ["sos-filings", filter],
    queryFn: async () => {
      let q = supabase.from("sos_filings").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell title="Secretary of State Filings" description="Manage SOS entity formations, amendments, and annual reports." icon={Building2}>
      <div className="flex items-center justify-between mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Entity</TableHead><TableHead>Type</TableHead><TableHead>State</TableHead>
              <TableHead>Filing #</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filings.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No filings found</TableCell></TableRow>
              ) : filings.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.entity_name}</TableCell>
                  <TableCell className="capitalize">{f.filing_type}</TableCell>
                  <TableCell>{f.state}</TableCell>
                  <TableCell>{f.filing_number || "—"}</TableCell>
                  <TableCell>{f.fee ? `$${Number(f.fee).toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge variant={statusColors[f.status] as any || "secondary"}>{f.status}</Badge></TableCell>
                  <TableCell>{format(new Date(f.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
