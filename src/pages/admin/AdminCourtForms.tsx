import { usePageMeta } from "@/hooks/usePageMeta";
import PageShell from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Scale, ShieldAlert } from "lucide-react";

export default function AdminCourtForms() {
  usePageMeta({ title: "Court Form Typing", noIndex: true });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["court-form-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("court_form_jobs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell title="Court Form Typing" description="UPL-compliant court form preparation services." icon={Scale}>
      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <strong>UPL Compliance:</strong> This service involves typing only — no legal advice. All jobs require client-signed UPL disclaimer before work begins.
        </AlertDescription>
      </Alert>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Form</TableHead><TableHead>Court</TableHead><TableHead>County</TableHead>
              <TableHead>Case #</TableHead><TableHead>UPL Accepted</TableHead><TableHead>Fee</TableHead>
              <TableHead>Status</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No court form jobs</TableCell></TableRow>
              ) : jobs.map((j: any) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.form_name}</TableCell>
                  <TableCell>{j.court_name || "—"}</TableCell>
                  <TableCell>{j.county || "—"}</TableCell>
                  <TableCell>{j.case_number || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={j.upl_disclaimer_accepted ? "default" : "destructive"}>
                      {j.upl_disclaimer_accepted ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{j.fee ? `$${Number(j.fee).toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{j.status}</Badge></TableCell>
                  <TableCell>{format(new Date(j.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
