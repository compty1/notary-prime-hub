/**
 * DASH-003/OPS-003: Data issues panel for admin
 * Shows records with missing fields, failed webhooks, orphaned data
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DataIssue {
  id: string;
  type: "missing_field" | "orphaned" | "webhook_fail" | "stale";
  entity: string;
  entityId: string;
  description: string;
  severity: "low" | "medium" | "high";
  detectedAt: string;
}

export function DataIssuesPanel() {
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const scanForIssues = async () => {
    setLoading(true);
    const found: DataIssue[] = [];

    // Check appointments missing confirmation numbers
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_date, service_type, confirmation_number")
      .is("confirmation_number", null)
      .limit(20);
    appts?.forEach(a => {
      found.push({
        id: `appt-${a.id}`, type: "missing_field", entity: "Appointment", entityId: a.id,
        description: `Missing confirmation number (${a.service_type} on ${a.scheduled_date})`,
        severity: "medium", detectedAt: new Date().toISOString(),
      });
    });

    // Check documents without appointments
    const { data: docs } = await supabase
      .from("documents")
      .select("id, file_name, appointment_id")
      .is("appointment_id", null)
      .eq("status", "uploaded")
      .limit(20);
    docs?.forEach(d => {
      found.push({
        id: `doc-${d.id}`, type: "orphaned", entity: "Document", entityId: d.id,
        description: `Orphaned document: ${d.file_name} (no linked appointment)`,
        severity: "low", detectedAt: new Date().toISOString(),
      });
    });

    // Check payments with failed status
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, status, created_at")
      .eq("status", "failed")
      .limit(20);
    payments?.forEach(p => {
      found.push({
        id: `pay-${p.id}`, type: "webhook_fail", entity: "Payment", entityId: p.id,
        description: `Failed payment: $${p.amount}`,
        severity: "high", detectedAt: p.created_at,
      });
    });

    setIssues(found);
    setLoading(false);
  };

  useEffect(() => { scanForIssues(); }, []);

  const severityColor = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Data Issues
          {!loading && <Badge variant="secondary">{issues.length}</Badge>}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={scanForIssues} disabled={loading} aria-label="Action">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {issues.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No data issues detected ✓</p>
        )}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {issues.map(issue => (
            <div key={issue.id} className="flex items-start justify-between rounded border p-2.5 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className={`text-[10px] ${severityColor[issue.severity]}`}>{issue.severity}</Badge>
                  <span className="font-medium text-xs">{issue.entity}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
