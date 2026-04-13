import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, Shield, DollarSign, Calendar, Download, TrendingUp } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function AdminReportsCenter() {
  const [reportType, setReportType] = useState("revenue");
  const [period, setPeriod] = useState("30");

  const startDate = format(subDays(new Date(), parseInt(period)), "yyyy-MM-dd");

  const { data: revenueData = [] } = useQuery({
    queryKey: ["report-revenue", startDate],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount, status, method, created_at").gte("created_at", startDate).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: reportType === "revenue",
  });

  const { data: complianceData = [] } = useQuery({
    queryKey: ["report-compliance", startDate],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("id, entry_date, notarial_act_type, notary_name, created_at").gte("created_at", startDate).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: reportType === "compliance",
  });

  const { data: operationsData = [] } = useQuery({
    queryKey: ["report-operations", startDate],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("id, status, service_type, scheduled_date, created_at").gte("created_at", startDate).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: reportType === "operations",
  });

  const totalRevenue = revenueData.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const paidCount = revenueData.filter((p: any) => p.status === "paid").length;
  const pendingRevenue = revenueData.filter((p: any) => p.status !== "paid").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const completedAppts = operationsData.filter((a: any) => a.status === "completed" || a.status === "notarized").length;
  const cancelledAppts = operationsData.filter((a: any) => a.status === "cancelled").length;
  const totalAppts = operationsData.length;

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Reports Center</h1>
          <p className="text-sm text-muted-foreground">Generate compliance, revenue, and operational reports</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue"><DollarSign className="h-3 w-3 inline mr-1" />Revenue Report</SelectItem>
            <SelectItem value="compliance"><Shield className="h-3 w-3 inline mr-1" />Compliance Report</SelectItem>
            <SelectItem value="operations"><Calendar className="h-3 w-3 inline mr-1" />Operations Report</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === "revenue" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Revenue (Paid)</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{paidCount}</p><p className="text-xs text-muted-foreground">Transactions</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-amber-600">${pendingRevenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Pending/Unpaid</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Revenue Details</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(revenueData, "revenue_report")}><Download className="h-3 w-3 mr-1" /> Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Method</TableHead></TableRow></TableHeader>
                <TableBody>
                  {revenueData.slice(0, 50).map((p: any) => (
                    <TableRow key={p.created_at + p.amount}>
                      <TableCell className="text-xs">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-mono text-xs">${Number(p.amount).toFixed(2)}</TableCell>
                      <TableCell><Badge className={p.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : ""} variant="outline">{p.status}</Badge></TableCell>
                      <TableCell className="text-xs">{p.method || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "compliance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{complianceData.length}</p><p className="text-xs text-muted-foreground">Journal Entries</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{new Set(complianceData.map((j: any) => j.notarial_act_type)).size}</p><p className="text-xs text-muted-foreground">Act Types Performed</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Journal Entries</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(complianceData, "compliance_report")}><Download className="h-3 w-3 mr-1" /> Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Act Type</TableHead><TableHead>Notary</TableHead></TableRow></TableHeader>
                <TableBody>
                  {complianceData.slice(0, 50).map((j: any) => (
                    <TableRow key={j.id}>
                      <TableCell className="text-xs">{j.entry_date || format(new Date(j.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{j.notarial_act_type}</Badge></TableCell>
                      <TableCell className="text-xs">{j.notary_name || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "operations" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{totalAppts}</p><p className="text-xs text-muted-foreground">Total Appointments</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-emerald-600">{completedAppts}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-red-600">{cancelledAppts}</p><p className="text-xs text-muted-foreground">Cancelled</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Operations Details</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(operationsData, "operations_report")}><Download className="h-3 w-3 mr-1" /> Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Service</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {operationsData.slice(0, 50).map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.scheduled_date}</TableCell>
                      <TableCell className="text-xs">{a.service_type}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
