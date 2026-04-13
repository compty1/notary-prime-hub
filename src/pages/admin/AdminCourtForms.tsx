import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Scale, ShieldAlert } from "lucide-react";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

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
    <DashboardEnhancer category="court-forms">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Court Form Typing</h1>
          <p className="text-sm text-muted-foreground">UPL-compliant court form preparation services.</p>
        </div>
      </div>
      <Alert className="border-destructive/50 bg-destructive/10">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>UPL Compliance:</strong> This service involves typing only — no legal advice. All jobs require client-signed UPL disclaimer before work begins.
        </AlertDescription>
      </Alert>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Form</TableHead><TableHead>Court</TableHead><TableHead>County</TableHead>
              <TableHead>Case #</TableHead><TableHead>UPL</TableHead><TableHead>Fee</TableHead>
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
    </div>
    </DashboardEnhancer>
  );
}
