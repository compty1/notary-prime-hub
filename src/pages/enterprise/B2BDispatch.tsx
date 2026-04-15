import React, { useState, useCallback } from "react";
import { Package, Upload, Download, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const REQUIRED_COLS = ["signer_name", "signer_email", "document_type", "address", "date"];
const TEMPLATE_CSV = "signer_name,signer_email,document_type,address,date\nJohn Doe,john@example.com,Acknowledgment,123 Main St,2025-01-15";

const B2BDispatch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: batches } = useQuery({
    queryKey: ["bulk-dispatch", user?.id],
    queryFn: async () => { const { data } = await supabase.from("bulk_dispatch_requests").select("*").order("created_at", { ascending: false }).limit(20); return data || []; },
    enabled: !!user,
  });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const Papa = (await import("papaparse")).default;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const errs: Record<number, string> = {};
        result.data.forEach((row: any, i: number) => {
          const missing = REQUIRED_COLS.filter(c => !row[c]?.trim());
          if (missing.length) errs[i] = `Missing: ${missing.join(", ")}`;
        });
        setRows(result.data as any[]);
        setErrors(errs);
        toast.success(`Parsed ${result.data.length} rows`);
      },
      error: () => toast.error("Failed to parse CSV"),
    });
  }, []);

  const handleSubmit = async () => {
    if (!user || rows.length === 0) return;
    setProcessing(true);
    const validRows = rows.filter((_, i) => !errors[i]);
    try {
      const { error } = await supabase.from("bulk_dispatch_requests").insert({
        user_id: user.id, batch_name: `Batch ${new Date().toLocaleDateString()}`,
        total_rows: rows.length, processed_rows: validRows.length, failed_rows: Object.keys(errors).length,
        status: "completed", source_data: validRows, error_log: errors,
      });
      if (error) throw error;
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["bulk-dispatch"] });
      toast.success(`${validRows.length} rows processed`);
    } catch (err: any) { toast.error(err.message); } finally { setProcessing(false); }
  };

  return (
    <EnterpriseLayout title="B2B Bulk Dispatch" icon={Package} description="Upload CSV batches for bulk signing requests">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <Button variant="dark" onClick={() => document.getElementById("csv-upload")?.click()}><Upload className="mr-2 h-4 w-4" />Upload CSV</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dispatch_template.csv"; a.click(); }}>
                <Download className="mr-1.5 h-3.5 w-3.5" />Download Template
              </Button>
            </div>
            {rows.length > 0 && (
              <>
                <div className="flex gap-3">
                  <Badge variant="secondary">{rows.length} total rows</Badge>
                  <Badge variant="default">{rows.length - Object.keys(errors).length} valid</Badge>
                  {Object.keys(errors).length > 0 && <Badge variant="destructive">{Object.keys(errors).length} errors</Badge>}
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Status</TableHead>{REQUIRED_COLS.map(c => <TableHead key={c} className="capitalize">{c.replace(/_/g, " ")}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {rows.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{errors[i] ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}</TableCell>
                        {REQUIRED_COLS.map(c => <TableCell key={c} className="text-sm">{row[c] || <span className="text-destructive">—</span>}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {processing && <Progress value={progress} />}
                <Button onClick={handleSubmit} disabled={processing || rows.length === Object.keys(errors).length} variant="dark" className="w-full">
                  {processing ? "Processing..." : `Submit ${rows.length - Object.keys(errors).length} Valid Rows`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {(batches?.length ?? 0) > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-black">Batch History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Total</TableHead><TableHead>Processed</TableHead><TableHead>Failed</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {batches?.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.batch_name}</TableCell>
                      <TableCell>{b.total_rows}</TableCell>
                      <TableCell>{b.processed_rows}</TableCell>
                      <TableCell>{b.failed_rows}</TableCell>
                      <TableCell><Badge variant="secondary">{b.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default B2BDispatch;
