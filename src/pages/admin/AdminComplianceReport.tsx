import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle2, AlertTriangle, Download, FileText, Eye, Save, XCircle } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";
import { formatDate, formatTime } from "@/lib/utils";

export default function AdminComplianceReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Record<string, any>[]>([]);
  const [journalEntries, setJournalEntries] = useState<Record<string, any>[]>([]);
  const [sealVerifications, setSealVerifications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drillDownAppt, setDrillDownAppt] = useState<Record<string, any> | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    setLoading(true);
    const startDate = `${selectedMonth}-01`;
    const endDate = getNextMonth(selectedMonth);

    Promise.all([
      supabase.from("appointments").select("*").eq("notarization_type", "ron").gte("scheduled_date", startDate).lt("scheduled_date", endDate),
      supabase.from("notary_journal").select("*").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("e_seal_verifications").select("*").gte("notarized_at", startDate).lt("notarized_at", endDate),
    ]).then(([apptRes, journalRes, sealRes]) => {
      setAppointments(apptRes.data || []);
      setJournalEntries(journalRes.data || []);
      setSealVerifications(sealRes.data || []);
      setLoading(false);
    });
  }, [selectedMonth]);

  function getNextMonth(m: string) {
    const [y, mo] = m.split("-").map(Number);
    const d = new Date(y, mo, 1);
    return d.toISOString().substring(0, 7) + "-01";
  }

  const report = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const withRecording = appointments.filter((a) => a.session_recording_duration && a.session_recording_duration > 0).length;
    const avgDuration = appointments.filter((a) => a.appointment_duration_actual).reduce((s, a) => s + a.appointment_duration_actual, 0) / (completed || 1);

    // FC-4: Automated gap detection
    const gaps: { type: string; message: string; severity: "critical" | "warning" | "info"; count: number }[] = [];

    // Missing recordings
    const missingRecording = completed - withRecording;
    if (missingRecording > 0) {
      gaps.push({ type: "recording", message: `${missingRecording} completed session(s) missing recording data — required per ORC §147.66`, severity: "critical", count: missingRecording });
    }

    // Missing journal entries for completed sessions
    const completedApptIds = new Set(appointments.filter(a => a.status === "completed").map(a => a.id));
    const journalApptIds = new Set(journalEntries.filter(j => j.appointment_id).map(j => j.appointment_id));
    const missingJournal = [...completedApptIds].filter(id => !journalApptIds.has(id)).length;
    if (missingJournal > 0) {
      gaps.push({ type: "journal", message: `${missingJournal} completed session(s) without journal entries — required per ORC §147.551`, severity: "critical", count: missingJournal });
    }

    // Missing seal verifications
    const sealDocIds = new Set(sealVerifications.map((v: Record<string, any>) => v.appointment_id as string).filter(Boolean));
    const missingSeal = [...completedApptIds].filter(id => !sealDocIds.has(id)).length;
    if (missingSeal > 0) {
      gaps.push({ type: "seal", message: `${missingSeal} completed session(s) without e-seal verification`, severity: "warning", count: missingSeal });
    }

    const complianceScore = total > 0 ? Math.round(((completed - missingRecording - missingJournal) / (completed || 1)) * 100) : 100;

    return { total, completed, withRecording, avgDuration: Math.round(avgDuration), gaps, complianceScore };
  }, [appointments, journalEntries, sealVerifications]);

  // FC-4: Per-session drill-down data
  const getSessionAudit = (appt: any) => {
    const hasJournal = journalEntries.some(j => j.appointment_id === appt.id);
    const hasRecording = appt.session_recording_duration > 0;
    const hasSeal = sealVerifications.some((v: Record<string, any>) => v.appointment_id === appt.id);
    return { hasJournal, hasRecording, hasSeal };
  };

  // FC-4: Save to compliance_reports table
  const saveReport = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("compliance_reports").insert({
      report_month: selectedMonth,
      report_type: "monthly_ron",
      generated_by: user.id,
      data: {
        total: report.total,
        completed: report.completed,
        withRecording: report.withRecording,
        avgDuration: report.avgDuration,
        complianceScore: report.complianceScore,
        gaps: report.gaps,
        generatedAt: new Date().toISOString(),
      },
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Report saved", description: `Compliance report for ${selectedMonth} saved successfully.` });
    setSaving(false);
  };

  const handleExport = () => {
    const rows = appointments.map((a) => {
      const audit = getSessionAudit(a);
      return {
        confirmation: a.confirmation_number || "",
        date: a.scheduled_date,
        time: a.scheduled_time,
        status: a.status,
        serviceType: a.service_type,
        recordingDuration: String(a.session_recording_duration || "N/A"),
        signerCount: String(a.signer_count || 1),
        hasJournal: audit.hasJournal ? "Yes" : "No",
        hasSeal: audit.hasSeal ? "Yes" : "No",
      };
    });
    const columns: { key: keyof (typeof rows)[0]; label: string }[] = [
      { key: "confirmation", label: "Confirmation #" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "status", label: "Status" },
      { key: "serviceType", label: "Service Type" },
      { key: "recordingDuration", label: "Recording Duration" },
      { key: "signerCount", label: "Signer Count" },
      { key: "hasJournal", label: "Journal Entry" },
      { key: "hasSeal", label: "E-Seal Verified" },
    ];
    exportToCSV(rows, columns, `ohio-ron-compliance-${selectedMonth}.csv`);
    toast({ title: "Exported", description: "CSV downloaded successfully." });
  };

  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(d.toISOString().substring(0, 7));
    }
    return opts;
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" /> Ohio RON Compliance Report
          </h1>
          <p className="text-muted-foreground text-sm">Monthly compliance summary per ORC §147.60–147.66</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={saveReport} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Report
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-primary" />
            <div className="text-2xl font-bold">{report.total}</div>
            <div className="text-xs text-muted-foreground">Total RON Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-600" />
            <div className="text-2xl font-bold">{report.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="text-2xl font-bold">{report.withRecording}</div>
            <div className="text-xs text-muted-foreground">With Recordings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="text-2xl font-bold">{report.avgDuration}m</div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </CardContent>
        </Card>
        <Card className={report.complianceScore >= 90 ? "border-green-500/30" : report.complianceScore >= 70 ? "border-yellow-500/30" : "border-red-500/30"}>
          <CardContent className="p-4 text-center">
            <Shield className={`mx-auto mb-2 h-6 w-6 ${report.complianceScore >= 90 ? "text-green-600" : report.complianceScore >= 70 ? "text-yellow-600" : "text-red-600"}`} />
            <div className="text-2xl font-bold">{report.complianceScore}%</div>
            <div className="text-xs text-muted-foreground">Compliance Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Gaps */}
      {report.gaps.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" /> Compliance Gaps ({report.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.gaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {gap.severity === "critical" ? (
                    <XCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                  <span>{gap.message}</span>
                  <Badge variant={gap.severity === "critical" ? "destructive" : "secondary"} className="ml-auto text-xs">{gap.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report.gaps.length === 0 && report.total > 0 && (
        <Card className="border-green-500/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <h3 className="font-semibold text-foreground">Fully Compliant</h3>
            <p className="text-sm text-muted-foreground">No compliance gaps detected for {selectedMonth}.</p>
          </CardContent>
        </Card>
      )}

      {report.total === 0 && (
        <Card className="border-border">
          <CardContent className="p-6 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground">No RON Sessions</h3>
            <p className="text-sm text-muted-foreground">No remote online notarization sessions recorded for {selectedMonth}.</p>
          </CardContent>
        </Card>
      )}

      {/* FC-4: Per-Session Audit Trail */}
      {appointments.filter(a => a.status === "completed").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointments.filter(a => a.status === "completed").map(appt => {
                const audit = getSessionAudit(appt);
                return (
                  <div key={appt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{appt.confirmation_number || appt.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(appt.scheduled_date)} at {formatTime(appt.scheduled_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={audit.hasRecording ? "default" : "destructive"} className="text-xs">
                        {audit.hasRecording ? "📹 Recorded" : "⚠️ No Recording"}
                      </Badge>
                      <Badge variant={audit.hasJournal ? "default" : "destructive"} className="text-xs">
                        {audit.hasJournal ? "📒 Journal" : "⚠️ No Journal"}
                      </Badge>
                      <Badge variant={audit.hasSeal ? "default" : "secondary"} className="text-xs">
                        {audit.hasSeal ? "🔏 Sealed" : "— No Seal"}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => setDrillDownAppt(appt)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drill-down dialog */}
      {drillDownAppt && (
        <Dialog open={!!drillDownAppt} onOpenChange={() => setDrillDownAppt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Session Details — {drillDownAppt.confirmation_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Date:</span> {formatDate(drillDownAppt.scheduled_date)}</div>
                <div><span className="text-muted-foreground">Time:</span> {formatTime(drillDownAppt.scheduled_time)}</div>
                <div><span className="text-muted-foreground">Service:</span> {drillDownAppt.service_type}</div>
                <div><span className="text-muted-foreground">Status:</span> {drillDownAppt.status}</div>
                <div><span className="text-muted-foreground">Signers:</span> {drillDownAppt.signer_count || 1}</div>
                <div><span className="text-muted-foreground">Recording:</span> {drillDownAppt.session_recording_duration ? `${drillDownAppt.session_recording_duration}s` : "None"}</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Compliance Checklist</h4>
                {(() => {
                  const audit = getSessionAudit(drillDownAppt);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {audit.hasRecording ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        <span>Session Recording (ORC §147.66)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.hasJournal ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        <span>Journal Entry (ORC §147.551)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.hasSeal ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        <span>E-Seal Verification</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
