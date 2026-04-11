import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileCheck } from "lucide-react";

export default function AdminPermitFilings() {
  usePageMeta({ title: "Permit Filings", noIndex: true });

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permit-filings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permit_filings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell title="Business Permits & Licenses" description="Track permit and license filing requests." icon={FileCheck}>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Permit Type</TableHead><TableHead>Business</TableHead><TableHead>Jurisdiction</TableHead>
              <TableHead>Permit #</TableHead><TableHead>Expiry</TableHead><TableHead>Fee</TableHead>
              <TableHead>Status</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {permits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No permit filings</TableCell></TableRow>
              ) : permits.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium capitalize">{p.permit_type}</TableCell>
                  <TableCell>{p.business_name || "—"}</TableCell>
                  <TableCell>{p.jurisdiction || "—"}</TableCell>
                  <TableCell>{p.permit_number || "—"}</TableCell>
                  <TableCell>{p.expiry_date ? format(new Date(p.expiry_date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell>{p.fee ? `$${Number(p.fee).toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                  <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
