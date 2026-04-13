import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2, AlertTriangle, XCircle, Timer } from "lucide-react";
import { differenceInHours, differenceInMinutes, parseISO } from "date-fns";

const SLA_TARGETS: Record<string, { target_hours: number; label: string }> = {
  "Mobile Notary": { target_hours: 4, label: "4h response" },
  "Remote Online Notarization (RON)": { target_hours: 2, label: "2h session start" },
  "Apostille Coordination": { target_hours: 48, label: "48h processing" },
  "Process Serving": { target_hours: 72, label: "72h first attempt" },
  "Courier Service": { target_hours: 24, label: "24h delivery" },
  "Document Translation": { target_hours: 72, label: "72h turnaround" },
  "Fingerprinting": { target_hours: 24, label: "24h scheduling" },
  "Background Check": { target_hours: 120, label: "5-day processing" },
  "Court Form Preparation": { target_hours: 48, label: "48h completion" },
  "I-9 Verification": { target_hours: 24, label: "24h verification" },
};

export default function AdminSLAMonitor() {
  const { data: appointments = [] } = useQuery({
    queryKey: ["sla-appointments"],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("id, service_type, status, created_at, scheduled_date, scheduled_time, updated_at")
        .in("status", ["scheduled", "confirmed", "in_progress", "completed", "notarized"])
        .order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["sla-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, service_type, status, created_at, updated_at")
        .order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  // Calculate SLA metrics per service type
  const slaMetrics = Object.entries(SLA_TARGETS).map(([service, target]) => {
    const serviceAppts = appointments.filter((a: any) => a.service_type === service);
    const serviceOrders = orders.filter((o: any) => o.service_type === service);
    const allItems = [...serviceAppts, ...serviceOrders];

    if (allItems.length === 0) return { service, ...target, total: 0, met: 0, breached: 0, pending: 0, compliance: 100 };

    let met = 0, breached = 0, pending = 0;
    for (const item of allItems) {
      const created = parseISO(item.created_at);
      const now = new Date();
      const hoursElapsed = differenceInHours(now, created);

      if (item.status === "completed" || item.status === "notarized" || item.status === "fulfilled") {
        const resolved = parseISO(item.updated_at);
        const resolutionHours = differenceInHours(resolved, created);
        if (resolutionHours <= target.target_hours) met++; else breached++;
      } else {
        if (hoursElapsed > target.target_hours) breached++; else pending++;
      }
    }

    const total = allItems.length;
    const compliance = total > 0 ? Math.round((met / Math.max(met + breached, 1)) * 100) : 100;

    return { service, ...target, total, met, breached, pending, compliance };
  });

  const overallCompliance = slaMetrics.length > 0
    ? Math.round(slaMetrics.reduce((s, m) => s + m.compliance, 0) / slaMetrics.length)
    : 100;

  const totalBreaches = slaMetrics.reduce((s, m) => s + m.breached, 0);
  const totalMet = slaMetrics.reduce((s, m) => s + m.met, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Timer className="h-6 w-6 text-primary" /> SLA Monitor</h1>
        <p className="text-sm text-muted-foreground">Service Level Agreement compliance across all service types</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={overallCompliance >= 95 ? "border-emerald-500/30" : overallCompliance >= 80 ? "border-amber-500/30" : "border-red-500/30"}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {overallCompliance >= 95 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
              <div><p className="text-2xl font-bold">{overallCompliance}%</p><p className="text-xs text-muted-foreground">Overall SLA Compliance</p></div>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-emerald-600">{totalMet}</p><p className="text-xs text-muted-foreground">SLAs Met</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-red-600">{totalBreaches}</p><p className="text-xs text-muted-foreground">SLA Breaches</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{Object.keys(SLA_TARGETS).length}</p><p className="text-xs text-muted-foreground">Tracked Services</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">SLA Compliance by Service</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>SLA Target</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Met</TableHead>
                <TableHead>Breached</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaMetrics.map(m => (
                <TableRow key={m.service}>
                  <TableCell className="font-medium text-xs">{m.service}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{m.label}</Badge></TableCell>
                  <TableCell className="text-xs">{m.total}</TableCell>
                  <TableCell className="text-xs text-emerald-600 font-medium">{m.met}</TableCell>
                  <TableCell className="text-xs text-red-600 font-medium">{m.breached}</TableCell>
                  <TableCell className="text-xs">{m.pending}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={m.compliance} className="w-16 h-2" />
                      <Badge className={m.compliance >= 95 ? "bg-emerald-500/10 text-emerald-600" : m.compliance >= 80 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"} variant="outline">
                        {m.compliance}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
