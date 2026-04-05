import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle2, AlertTriangle, Download, FileText } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";

export default function AdminComplianceReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    supabase
      .from("appointments")
      .select("*")
      .eq("notarization_type", "ron")
      .gte("scheduled_date", `${selectedMonth}-01`)
      .lt("scheduled_date", getNextMonth(selectedMonth))
      .then(({ data }) => {
        setAppointments(data || []);
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

    const gaps: string[] = [];
    if (withRecording < completed) gaps.push(`${completed - withRecording} sessions missing recording data`);
    appointments.forEach((a) => {
      if (a.status === "completed" && !a.session_recording_duration) {
        gaps.push(`Session ${a.confirmation_number || a.id} lacks recording duration`);
      }
    });

    return { total, completed, withRecording, avgDuration: Math.round(avgDuration), gaps };
  }, [appointments]);

  const handleExport = () => {
    const rows = appointments.map((a) => ({
      confirmation: a.confirmation_number || "",
      date: a.scheduled_date,
      time: a.scheduled_time,
      status: a.status,
      serviceType: a.service_type,
      recordingDuration: String(a.session_recording_duration || "N/A"),
      signerCount: String(a.signer_count || 1),
    }));
    const columns: { key: keyof (typeof rows)[0]; label: string }[] = [
      { key: "confirmation", label: "Confirmation #" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "status", label: "Status" },
      { key: "serviceType", label: "Service Type" },
      { key: "recordingDuration", label: "Recording Duration" },
      { key: "signerCount", label: "Signer Count" },
    ];
    exportToCSV(rows, columns, `ohio-ron-compliance-${selectedMonth}.csv`);
    toast({ title: "Exported", description: "CSV downloaded successfully." });
  };

  // Generate month options
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" /> Ohio RON Compliance Report
          </h1>
          <p className="text-muted-foreground text-sm">Monthly compliance summary per ORC §147.60–147.66</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
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
      </div>

      {report.gaps.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" /> Compliance Gaps ({report.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.gaps.slice(0, 10).map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
                  <span>{gap}</span>
                </div>
              ))}
              {report.gaps.length > 10 && (
                <p className="text-xs text-muted-foreground">...and {report.gaps.length - 10} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {report.gaps.length === 0 && (
        <Card className="border-green-500/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <h3 className="font-semibold text-foreground">Fully Compliant</h3>
            <p className="text-sm text-muted-foreground">No compliance gaps detected for {selectedMonth}.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
