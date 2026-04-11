import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, FileText } from "lucide-react";

const statusColors: Record<string, string> = { pending: "secondary", submitted: "default", recorded: "default", rejected: "destructive" };

export default function AdminRecorderFilings() {
  usePageMeta({ title: "Recorder Filings", noIndex: true });
  const [filter, setFilter] = useState("all");

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ["recorder-filings", filter],
    queryFn: async () => {
      let q = supabase.from("recorder_filings").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell title="County Recorder Filings" description="Track document recordings with county recorders." icon={FileText}>
      <div className="flex items-center justify-between mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="recorded">Recorded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Document</TableHead><TableHead>County</TableHead><TableHead>Type</TableHead>
              <TableHead>Recording #</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filings.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No filings found</TableCell></TableRow>
              ) : filings.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.document_description}</TableCell>
                  <TableCell>{f.county || "—"}</TableCell>
                  <TableCell className="capitalize">{f.recording_type}</TableCell>
                  <TableCell>{f.recording_number || "—"}</TableCell>
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
