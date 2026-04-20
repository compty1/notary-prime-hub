import { usePageMeta } from "@/hooks/usePageMeta";
import { formatDate } from "@/lib/utils";
import { RevenueByServiceChart } from "@/components/RevenueByServiceChart";
import { RevenueForecast } from "@/components/RevenueForecast";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Receipt, Download, CreditCard, Send, Loader2, Plus, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/auditLog";
import { printReceipt } from "@/lib/receiptGenerator";

const getDateRange = (range: string) => {
  const now = new Date();
  const start = new Date();
  switch (range) {
    case "week": { const day = now.getDay(); start.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); start.setHours(0, 0, 0, 0); break; }
    case "month": start.setMonth(now.getMonth() - 1); break;
    case "quarter": start.setMonth(now.getMonth() - 3); break;
    case "year": start.setFullYear(now.getFullYear() - 1); break;
    default: return null;
  }
  return start.toISOString();
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function AdminRevenue() {
  usePageMeta({ title: "Revenue", noIndex: true });
  const { toast } = useToast();
  const [entries, setEntries] = useState<Record<string, any>[]>([]);
  const [payments, setPayments] = useState<Record<string, any>[]>([]);
  const [servicePayments, setServicePayments] = useState<Record<string, any>[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [allProfiles, setAllProfiles] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Payment request dialog
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [paymentReqForm, setPaymentReqForm] = useState({ client_id: "", amount: "", notes: "" });
  const [sendingRequest, setSendingRequest] = useState(false);

  // Manual payment recording
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [recordForm, setRecordForm] = useState({ client_id: "", amount: "", method: "cash", notes: "" });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Record<string, any> | null>(null);
  const [refundReason, setRefundReason] = useState("Requested by customer");
  const [processingRefund, setProcessingRefund] = useState(false);

  const handleRefund = async () => {
    if (!refundTarget || !refundReason.trim()) return;
    setProcessingRefund(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { payment_id: refundTarget.id, reason: refundReason },
      });
      if (error) throw error;
      toast({ title: "Refund processed", description: data?.stripe_refund_id ? `Stripe refund: ${data.stripe_refund_id}` : "Manual refund recorded" });
      logAuditEvent("payment_refunded", { entityType: "payments", entityId: refundTarget.id, details: { reason: refundReason } });
      setPayments(prev => prev.map(pay => pay.id === refundTarget.id ? { ...pay, status: "refunded" } : pay));
      setRefundDialogOpen(false);
      setRefundTarget(null);
      setRefundReason("Requested by customer");
    } catch (e: any) {
      toast({ title: "Refund failed", description: e.message, variant: "destructive" });
    } finally {
      setProcessingRefund(false);
    }
  };

  // Pagination
  const PAYMENTS_PER_PAGE = 25;
  const [paymentPage, setPaymentPage] = useState(1);
  const totalPaymentPages = Math.max(1, Math.ceil(payments.length / PAYMENTS_PER_PAGE));

  // Profile search filter
  const [profileSearch, setProfileSearch] = useState("");
  const filteredProfiles = useMemo(() => {
    if (!profileSearch.trim()) return allProfiles;
    const q = profileSearch.toLowerCase();
    return allProfiles.filter((p: any) => 
      (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q)
    );
  }, [allProfiles, profileSearch]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const rangeStart = getDateRange(dateRange);
      let journalQuery = supabase.from("notary_journal").select("*").order("created_at", { ascending: false });
      let paymentQuery = supabase.from("payments").select("*").order("created_at", { ascending: false });
      // Item 281: Also fetch service request payments
      let serviceReqQuery = supabase.from("service_requests").select("id, service_name, status, created_at").in("status", ["completed", "delivered"]);
      if (rangeStart) {
        journalQuery = journalQuery.gte("created_at", rangeStart);
        paymentQuery = paymentQuery.gte("created_at", rangeStart);
        serviceReqQuery = serviceReqQuery.gte("created_at", rangeStart);
      }
      const [{ data: journalData }, { data: paymentData }, { data: profileData }, { data: svcData }] = await Promise.all([
        journalQuery, paymentQuery,
        supabase.from("profiles").select("user_id, full_name, email").limit(999),
        serviceReqQuery,
      ]);
      if (journalData) setEntries(journalData);
      if (paymentData) setPayments(paymentData);
      if (svcData) setServicePayments(svcData);
      if (profileData) {
        const map: Record<string, string> = {};
        profileData.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || p.user_id.slice(0, 8); });
        setProfiles(map);
        setAllProfiles(profileData);
      }
      setLoading(false);
    };
    fetchData();
    setPaymentPage(1); // Item 302: Reset page when dateRange changes
  }, [dateRange]);

  const filtered = typeFilter === "all" ? entries : entries.filter((e) => e.notarization_type === typeFilter);

  const totalRevenue = filtered.reduce((sum, e) => sum + (parseFloat(e.fees_charged) || 0), 0);
  const totalPlatformFees = filtered.reduce((sum, e) => sum + (parseFloat(e.platform_fees) || 0), 0);
  const totalTravelFees = filtered.reduce((sum, e) => sum + (parseFloat(e.travel_fee) || 0), 0);
  const totalSigningPlatformFees = filtered.reduce((sum, e) => sum + (parseFloat(e.platform_fee) || 0), 0);
  const totalExpenses = totalPlatformFees + totalTravelFees + totalSigningPlatformFees;
  const netProfit = totalRevenue - totalExpenses;
  const avgPerSession = filtered.length > 0 ? netProfit / filtered.length : 0;

  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Bug 481: Using shared formatDate from @/lib/utils (imported at top)

  const escapeCSV = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCSV = () => {
    const headers = ["Date", "Client", "Service", "Type", "Fee", "Platform Fees", "Signing Platform Fee", "Travel Fee", "Notary Payout", "Net Profit"];
    const rows = filtered.map((e) => {
      const fee = parseFloat(e.fees_charged) || 0;
      const platform = parseFloat(e.platform_fees) || 0;
      const signingFee = parseFloat(e.platform_fee) || 0;
      const travel = parseFloat(e.travel_fee) || 0;
      const payout = parseFloat(e.notary_payout) || 0;
      return [formatDate(e.created_at), e.signer_name, e.document_type, e.notarization_type, fee.toFixed(2), platform.toFixed(2), signingFee.toFixed(2), travel.toFixed(2), payout.toFixed(2), (fee - platform - signingFee - travel).toFixed(2)].map(escapeCSV);
    });
    const csv = [headers.map(escapeCSV), ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `revenue_${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Item 289: Export payments CSV
  const exportPaymentsCSV = () => {
    const headers = ["Date", "Client", "Amount", "Method", "Status", "Paid At", "Notes"];
    const rows = payments.map((p) => [
      formatDate(p.created_at), profiles[p.client_id] || p.client_id.slice(0, 8),
      parseFloat(p.amount).toFixed(2), p.method || "—", p.status,
      p.paid_at ? formatDate(p.paid_at) : "—", (p.notes || "").replace(/,/g, ";"),
    ].map(escapeCSV));
    const csv = [headers.map(escapeCSV), ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payments_${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sendPaymentRequest = async () => {
    if (!paymentReqForm.client_id || !paymentReqForm.amount) {
      toast({ title: "Client and amount required", variant: "destructive" });
      return;
    }
    setSendingRequest(true);
    const amount = parseFloat(paymentReqForm.amount);
    if (amount <= 0) {
      toast({ title: "Amount must be positive", variant: "destructive" });
      setSendingRequest(false);
      return;
    }
    const { error } = await supabase.from("payments").insert({
      client_id: paymentReqForm.client_id,
      amount,
      status: "pending",
      method: "stripe",
      notes: paymentReqForm.notes || "Payment requested by admin",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment request created", description: `$${amount.toFixed(2)} pending for client.` });
      logAuditEvent("payment_requested", { entityType: "payments", details: { client_id: paymentReqForm.client_id, amount } });
      setShowPaymentRequest(false);
      setPaymentReqForm({ client_id: "", amount: "", notes: "" });
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (data) setPayments(data);
    }
    setSendingRequest(false);
  };

  const recordPayment = async () => {
    if (!recordForm.client_id || !recordForm.amount) {
      toast({ title: "Client and amount required", variant: "destructive" });
      return;
    }
    const amount = parseFloat(recordForm.amount);
    if (amount <= 0) {
      toast({ title: "Amount must be positive", variant: "destructive" });
      return;
    }
    setRecordingPayment(true);
    // Item 301: Set paid_at on manual recording
    const { error } = await supabase.from("payments").insert({
      client_id: recordForm.client_id,
      amount,
      status: "paid",
      paid_at: new Date().toISOString(),
      method: recordForm.method,
      notes: recordForm.notes || `Recorded ${recordForm.method} payment`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment recorded", description: `$${amount.toFixed(2)} marked as paid.` });
      logAuditEvent("payment_recorded", { entityType: "payments", details: { client_id: recordForm.client_id, amount, method: recordForm.method } });
      setShowRecordPayment(false);
      setRecordForm({ client_id: "", amount: "", method: "cash", notes: "" });
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (data) setPayments(data);
    }
    setRecordingPayment(false);
  };

  const markPaid = async (paymentId: string) => {
    const { error } = await supabase.from("payments").update({
      status: "paid",
      paid_at: new Date().toISOString(),
    } ).eq("id", paymentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as paid" });
      logAuditEvent("payment_status_changed", { entityType: "payments", entityId: paymentId, details: { new_status: "paid" } });
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: "paid", paid_at: new Date().toISOString() } : p));
    }
  };

  // Bug 541: YTD calculations
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const ytdRevenue = entries.filter(e => e.created_at >= ytdStart).reduce((sum, e) => sum + (parseFloat(e.fees_charged) || 0), 0);
  const ytdPaid = payments.filter(p => p.status === "paid" && p.created_at >= ytdStart).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const statCards = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-info" },
    { label: "YTD Revenue", value: `$${ytdRevenue.toFixed(2)}`, icon: Calendar, color: "text-primary" },
    { label: "Profit Margin", value: `${profitMargin}%`, icon: TrendingUp, color: parseFloat(profitMargin) >= 50 ? "text-primary" : "text-warning" },
    { label: "Total Expenses", value: `$${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: "text-destructive" },
    { label: "Net Profit", value: `$${netProfit.toFixed(2)}`, icon: TrendingUp, color: netProfit >= 0 ? "text-primary" : "text-destructive" },
    { label: "Avg Profit/Session", value: `$${avgPerSession.toFixed(2)}`, icon: Receipt, color: "text-primary" },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Revenue & Payments</h1>
          <p className="text-sm text-muted-foreground">Track earnings, expenses, and payment status</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowPaymentRequest(true)}>
            <Send className="mr-1 h-3 w-3" /> Request Payment
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRecordPayment(true)}>
            <Plus className="mr-1 h-3 w-3" /> Record Payment
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="ron">RON</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}><Download className="mr-1 h-3 w-3" /> CSV</Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Charts */}
      {(() => {
        const monthlyRevenue = (() => {
          const months: Record<string, { revenue: number; expenses: number; net: number }> = {};
          filtered.forEach(e => {
            const month = e.created_at?.slice(0, 7);
            if (!month) return;
            if (!months[month]) months[month] = { revenue: 0, expenses: 0, net: 0 };
            const fee = parseFloat(e.fees_charged) || 0;
            const platform = parseFloat(e.platform_fees) || 0;
            const travel = parseFloat(e.travel_fee) || 0;
            months[month].revenue += fee;
            months[month].expenses += platform + travel;
            months[month].net += fee - platform - travel;
          });
          return Object.entries(months).slice(-6).map(([month, d]) => ({
            month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
            ...d,
          }));
        })();

        const monthlyPayments = (() => {
          const months: Record<string, { paid: number; pending: number }> = {};
          payments.forEach(p => {
            const month = p.created_at?.slice(0, 7);
            if (!month) return;
            if (!months[month]) months[month] = { paid: 0, pending: 0 };
            const amt = parseFloat(p.amount) || 0;
            if (p.status === "paid") months[month].paid += amt;
            else months[month].pending += amt;
          });
          return Object.entries(months).slice(-6).map(([month, d]) => ({
            month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
            ...d,
          }));
        })();

        return (
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue vs Expenses</CardTitle></CardHeader>
              <CardContent>
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                      <Bar dataKey="expenses" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-muted-foreground">No journal data yet</p>}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Profit Trend</CardTitle></CardHeader>
              <CardContent>
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Net Profit"]} />
                      <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* REM-076: Revenue by Service Pie Chart */}
      <div className="mb-6">
        <RevenueByServiceChart entries={filtered} />
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments"><CreditCard className="mr-1 h-4 w-4" /> Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="by-service"><Receipt className="mr-1 h-4 w-4" /> By Service</TabsTrigger>
          <TabsTrigger value="journal"><Receipt className="mr-1 h-4 w-4" /> Journal Revenue</TabsTrigger>
          <TabsTrigger value="outstanding"><DollarSign className="mr-1 h-4 w-4" /> Outstanding</TabsTrigger>
          <TabsTrigger value="forecast"><TrendingUp className="mr-1 h-4 w-4" /> Forecast</TabsTrigger>
        </TabsList>

        {/* Item 311: Revenue by Service Breakdown */}
        <TabsContent value="by-service">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Service Type</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const byService: Record<string, { count: number; revenue: number }> = {};
                filtered.forEach(e => {
                  const svc = e.document_type || "Unknown";
                  if (!byService[svc]) byService[svc] = { count: 0, revenue: 0 };
                  byService[svc].count++;
                  byService[svc].revenue += parseFloat(e.fees_charged) || 0;
                });
                const sorted = Object.entries(byService).sort((a, b) => b[1].revenue - a[1].revenue);
                if (sorted.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No journal data</p>;
                return (
                  <div className="space-y-2">
                    {sorted.map(([svc, data]) => (
                      <div key={svc} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div>
                          <p className="font-medium text-sm">{svc}</p>
                          <p className="text-xs text-muted-foreground">{data.count} session{data.count !== 1 ? "s" : ""}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">${data.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Item 316: Outstanding Balance Tracking */}
        <TabsContent value="outstanding">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balances</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const pending = payments.filter(p => p.status === "pending");
                if (pending.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No outstanding balances 🎉</p>;
                return (
                  <div className="space-y-2">
                    {pending.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/50 p-3">
                        <div>
                          <p className="font-medium text-sm">{profiles[p.client_id] || p.client_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.created_at)} · {p.notes || "No notes"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-warning">${parseFloat(p.amount).toFixed(2)}</p>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                      <p className="text-lg font-bold text-warning">${totalPending.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Collected</p></div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div>
                <div><p className="text-2xl font-bold text-warning">${totalPending.toFixed(2)}</p><p className="text-xs text-muted-foreground">Pending Collection</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Item 289: Export payments CSV button */}
          {payments.length > 0 && (
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportPaymentsCSV}><Download className="mr-1 h-3 w-3" /> Export Payments CSV</Button>
            </div>
          )}

          <Card className="border-border/50">
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No payments recorded yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid At</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr></thead>
                    <tbody>
                      {payments.slice((paymentPage - 1) * PAYMENTS_PER_PAGE, paymentPage * PAYMENTS_PER_PAGE).map((p) => (
                        <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-xs">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-3 font-medium">{profiles[p.client_id] || p.client_id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-right font-medium">${parseFloat(p.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs capitalize">{p.method || "—"}</td>
                          <td className="px-4 py-3"><Badge className={`text-xs ${paymentStatusColors[p.status] || "bg-muted"}`}>{p.status}</Badge></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.notes || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {p.status === "pending" && (
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => markPaid(p.id)}>
                                  Mark Paid
                                </Button>
                              )}
                              {p.status === "paid" && (
                                <Button size="sm" variant="ghost" className="text-xs" title="Print Receipt" onClick={() => {
                                  printReceipt({
                                    paymentId: p.id,
                                    date: p.paid_at || p.created_at,
                                    clientName: profiles[p.client_id] || "Client",
                                    clientEmail: "",
                                    amount: parseFloat(p.amount),
                                    method: p.method || "card",
                                    description: p.notes || undefined,
                                  });
                                }}>
                                  <Printer className="h-3 w-3" />
                                </Button>
                              )}
                              {p.status === "paid" && (
                                <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={() => {
                                  setRefundTarget(p);
                                  setRefundDialogOpen(true);
                                }}>
                                  Refund
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {payments.length > PAYMENTS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {(paymentPage - 1) * PAYMENTS_PER_PAGE + 1}–{Math.min(paymentPage * PAYMENTS_PER_PAGE, payments.length)} of {payments.length}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={paymentPage <= 1} onClick={() => setPaymentPage(p => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={paymentPage >= totalPaymentPages} onClick={() => setPaymentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-sans text-lg">Per-Session Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No journal entries for this period</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                     <thead><tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fee</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Platform</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Signing Platform</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Travel</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Payout</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                    </tr></thead>
                    <tbody>
                      {filtered.map((entry) => {
                        const fee = parseFloat(entry.fees_charged) || 0;
                        const platform = parseFloat(entry.platform_fees) || 0;
                        const signingFee = parseFloat(entry.platform_fee) || 0;
                        const travel = parseFloat(entry.travel_fee) || 0;
                        const payout = parseFloat(entry.notary_payout) || 0;
                        const net = fee - platform - signingFee - travel;
                        return (
                          <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">{formatDate(entry.created_at)}</td>
                            <td className="px-4 py-3 font-medium">{entry.signer_name}</td>
                            <td className="px-4 py-3">{entry.document_type}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{entry.notarization_type === "ron" ? "RON" : "In-Person"}</Badge></td>
                            <td className="px-4 py-3 text-right">${fee.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">${platform.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">${signingFee.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">${travel.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">${payout.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${net >= 0 ? "text-primary" : "text-destructive"}`}>${net.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <RevenueForecast />
        </TabsContent>
      </Tabs>

      {/* Request Payment Dialog */}
      <Dialog open={showPaymentRequest} onOpenChange={setShowPaymentRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Request Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Input placeholder="Search clients..." value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} className="mb-2" />
              <Select value={paymentReqForm.client_id} onValueChange={(v) => setPaymentReqForm({ ...paymentReqForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {filteredProfiles.map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" min="0.50" step="0.01" value={paymentReqForm.amount} onChange={(e) => setPaymentReqForm({ ...paymentReqForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={paymentReqForm.notes} onChange={(e) => setPaymentReqForm({ ...paymentReqForm, notes: e.target.value })} placeholder="Reason for payment request..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentRequest(false)}>Cancel</Button>
            <Button onClick={sendPaymentRequest} disabled={sendingRequest}>
              {sendingRequest ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={recordForm.client_id} onValueChange={(v) => setRecordForm({ ...recordForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {allProfiles.map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" min="0.50" step="0.01" value={recordForm.amount} onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={recordForm.method} onValueChange={(v) => setRecordForm({ ...recordForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cashapp">Cash App</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={recordForm.notes} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} placeholder="Payment details..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordPayment(false)}>Cancel</Button>
            <Button onClick={recordPayment} disabled={recordingPayment}>
              {recordingPayment ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Refunding <strong>${refundTarget?.amount}</strong> for payment {refundTarget?.id?.slice(0, 8)}…
            </p>
            <div>
              <Label>Reason</Label>
              <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Enter refund reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={processingRefund || !refundReason.trim()}>
              {processingRefund ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
