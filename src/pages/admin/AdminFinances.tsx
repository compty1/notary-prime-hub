import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/dateUtils";
import { DollarSign, TrendingUp, TrendingDown, Calculator, Plus, Car, FileText, BarChart3, CalendarClock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AdminFinances() {
  usePageMeta({ title: "Financial Dashboard | Admin", description: "Track expenses, revenue, and profitability" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMileage, setShowAddMileage] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("expense_categories").select("*").order("category_name");
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Fetch transactions
  type TransactionWithCategory = {
    id: string; user_id: string; type: string; amount: number;
    description: string; transaction_date: string; vendor: string | null;
    category_id: string | null; created_at: string;
    expense_categories: { category_name: string; irs_schedule_c_line: string | null } | null;
  };

  const { data: transactions = [] } = useQuery<TransactionWithCategory[]>({
    queryKey: ["financial-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_transactions").select("*, expense_categories(category_name, irs_schedule_c_line)").order("transaction_date", { ascending: false }).limit(200);
      return (data ?? []) as unknown as TransactionWithCategory[];
    },
  });

  // Fetch mileage logs
  const { data: mileageLogs = [] } = useQuery({
    queryKey: ["mileage-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("mileage_logs").select("*").order("trip_date", { ascending: false }).limit(200);
      return data || [];
    },
  });

  // Fetch recurring
  const { data: recurring = [] } = useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: async () => {
      const { data } = await supabase.from("recurring_expenses").select("*, expense_categories(category_name)").order("next_due");
      return data || [];
    },
  });

  // Fetch amortized expenses
  const { data: amortized = [] } = useQuery({
    queryKey: ["amortized-expenses"],
    queryFn: async () => {
      const { data } = await supabase.from("amortized_expenses").select("*, expense_categories(category_name)").order("start_date", { ascending: false });
      return data || [];
    },
  });

  // Fetch revenue (payments)
  const { data: payments = [] } = useQuery({
    queryKey: ["revenue-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount, status, created_at").eq("status", "paid").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  // Add expense mutation
  const addExpense = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("financial_transactions").insert({ ...values, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financial-transactions"] }); toast.success("Expense added"); setShowAddExpense(false); },
    onError: (e: any) => toast.error(e.message),
  });

  // Add mileage mutation
  const addMileage = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("mileage_logs").insert({ ...values, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mileage-logs"] }); toast.success("Mileage logged"); setShowAddMileage(false); },
    onError: (e: any) => toast.error(e.message),
  });

  // Calculations
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalMileageDeduction = mileageLogs.reduce((s, m) => s + Number(m.total_deduction || 0), 0);
  const totalAmortized = amortized.reduce((s, a) => s + Number(a.monthly_amount || (Number(a.annual_amount) / 12)), 0);
  const netProfit = totalRevenue - totalExpenses - totalMileageDeduction - totalAmortized;
  const monthlyBurn = recurring.filter(r => r.is_active).reduce((s, r) => {
    const amt = Number(r.amount || 0);
    return s + (r.frequency === "yearly" ? amt / 12 : r.frequency === "quarterly" ? amt / 3 : r.frequency === "weekly" ? amt * 4.33 : amt);
  }, 0);
  const totalNotarizations = payments.length;
  const cpn = totalNotarizations > 0 ? (totalExpenses + totalMileageDeduction) / totalNotarizations : 0;

  // Category breakdown for pie chart
  const categoryBreakdown = transactions
    .filter(t => t.type === "expense")
    .reduce((acc: Record<string, number>, t) => {
      const cat = t.expense_categories?.category_name || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {});
  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const rev = payments.filter(p => p.created_at?.startsWith(month)).reduce((s, p) => s + Number(p.amount || 0), 0);
    const exp = transactions.filter(t => t.type === "expense" && t.transaction_date?.startsWith(month)).reduce((s, t) => s + Number(t.amount || 0), 0);
    return { month: label, revenue: rev, expenses: exp, profit: rev - exp };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddMileage(true)}><Car className="h-4 w-4 mr-1" /> Log Mileage</Button>
          <Button size="sm" onClick={() => setShowAddExpense(true)}><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="pt-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingDown className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">Net Profit</p><p className={`text-lg font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(netProfit)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calculator className="h-5 w-5 mx-auto text-accent-foreground mb-1" /><p className="text-xs text-muted-foreground">CPN</p><p className="text-lg font-bold text-foreground">{formatCurrency(cpn)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Car className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">Mileage Deduction</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalMileageDeduction)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Monthly Burn</p><p className="text-lg font-bold text-foreground">{formatCurrency(monthlyBurn)}</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="pnl">P&L</TabsTrigger><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="recurring">Recurring</TabsTrigger><TabsTrigger value="amortized">Amortized</TabsTrigger><TabsTrigger value="mileage">Mileage</TabsTrigger><TabsTrigger value="tax">Tax Prep</TabsTrigger></TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Revenue vs Expenses (6 Mo)</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Expense Breakdown</CardTitle></CardHeader><CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No expense data yet</p>}
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="pnl">
          <Card><CardHeader><CardTitle className="text-sm">Profit & Loss Statement</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Line Item</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow className="font-bold bg-muted/30"><TableCell>Revenue</TableCell><TableCell className="text-right text-success">{formatCurrency(totalRevenue)}</TableCell></TableRow>
                <TableRow><TableCell className="pl-6">Notarization Fees ({payments.length} sessions)</TableCell><TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell></TableRow>
                <TableRow className="font-bold bg-muted/30"><TableCell>Cost of Services</TableCell><TableCell className="text-right text-destructive">({formatCurrency(totalExpenses)})</TableCell></TableRow>
                {pieData.slice(0, 8).map((cat) => (
                  <TableRow key={cat.name}><TableCell className="pl-6">{cat.name}</TableCell><TableCell className="text-right">({formatCurrency(cat.value)})</TableCell></TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30"><TableCell>Other Deductions</TableCell><TableCell className="text-right text-destructive">({formatCurrency(totalMileageDeduction + totalAmortized)})</TableCell></TableRow>
                <TableRow><TableCell className="pl-6">Mileage Deduction</TableCell><TableCell className="text-right">({formatCurrency(totalMileageDeduction)})</TableCell></TableRow>
                <TableRow><TableCell className="pl-6">Amortized Expenses</TableCell><TableCell className="text-right">({formatCurrency(totalAmortized)})</TableCell></TableRow>
                <TableRow className="font-bold text-lg border-t-2"><TableCell>Net Profit</TableCell><TableCell className={`text-right ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(netProfit)}</TableCell></TableRow>
                <TableRow><TableCell className="pl-6 text-muted-foreground">Profit Margin</TableCell><TableCell className="text-right text-muted-foreground">{totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : "N/A"}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card><CardContent className="pt-4">
            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Vendor</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactions.filter(t => t.type === "expense").slice(0, 50).map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{formatDate(t.transaction_date)}</TableCell>
                    <TableCell className="text-sm">{t.description || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.expense_categories?.category_name || "—"}</Badge></TableCell>
                    <TableCell className="text-sm">{t.vendor || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">{formatCurrency(Number(t.amount))}</TableCell>
                  </TableRow>
                ))}
                {transactions.filter(t => t.type === "expense").length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No expenses recorded yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card><CardContent className="pt-4">
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Vendor</TableHead><TableHead>Frequency</TableHead><TableHead>Next Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {recurring.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm">{r.vendor || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{r.frequency}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(r.next_due)}</TableCell>
                    <TableCell><Badge variant={r.is_active ? "default" : "secondary"} className="text-xs">{r.is_active ? "Active" : "Paused"}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(r.amount))}</TableCell>
                  </TableRow>
                ))}
                {recurring.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No recurring expenses</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="amortized">
          <Card><CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">Track large expenses spread over time (e.g., notary bond, E&O insurance, commission renewals).</p>
            <Table><TableHeader><TableRow><TableHead>Expense</TableHead><TableHead>Category</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Annual</TableHead><TableHead className="text-right">Monthly</TableHead></TableRow></TableHeader>
              <TableBody>
                {amortized.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium">{a.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.expense_categories?.category_name || "—"}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(a.start_date)} – {formatDate(a.end_date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(a.annual_amount))}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatCurrency(Number(a.monthly_amount || (Number(a.annual_amount) / 12)))}</TableCell>
                  </TableRow>
                ))}
                {amortized.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No amortized expenses yet</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Monthly Amortization</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalAmortized)}</span>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="mileage">
          <Card><CardContent className="pt-4">
            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <div><p className="text-sm font-medium">Total Miles: {mileageLogs.reduce((s, m) => s + Number(m.miles || 0), 0).toFixed(1)}</p><p className="text-xs text-muted-foreground">IRS Rate: $0.70/mile (2026)</p></div>
              <div className="text-right"><p className="text-sm font-medium">Total Deduction</p><p className="text-lg font-bold text-primary">{formatCurrency(totalMileageDeduction)}</p></div>
            </div>
            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Purpose</TableHead><TableHead className="text-right">Miles</TableHead><TableHead className="text-right">Deduction</TableHead></TableRow></TableHeader>
              <TableBody>
                {mileageLogs.slice(0, 50).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{formatDate(m.trip_date)}</TableCell>
                    <TableCell className="text-sm">{m.origin}</TableCell>
                    <TableCell className="text-sm">{m.destination}</TableCell>
                    <TableCell className="text-sm">{m.purpose || "—"}</TableCell>
                    <TableCell className="text-right">{Number(m.miles).toFixed(1)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatCurrency(Number(m.total_deduction))}</TableCell>
                  </TableRow>
                ))}
                {mileageLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No mileage logs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Schedule C Export</CardTitle></CardHeader><CardContent>
            <p className="text-sm text-muted-foreground mb-4">Export your expenses categorized by IRS Schedule C line items for tax preparation.</p>
            <Table><TableHeader><TableRow><TableHead>Schedule C Line</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(
                  transactions.filter(t => t.type === "expense").reduce((acc: Record<string, { categories: string[]; total: number }>, t) => {
                    const line = t.expense_categories?.irs_schedule_c_line || "Uncategorized";
                    const cat = t.expense_categories?.category_name || "Other";
                    if (!acc[line]) acc[line] = { categories: [], total: 0 };
                    if (!acc[line].categories.includes(cat)) acc[line].categories.push(cat);
                    acc[line].total += Number(t.amount);
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b)).map(([line, data]) => (
                  <TableRow key={line}>
                    <TableCell className="text-sm font-medium">{line}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{data.categories.join(", ")}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(data.total)}</TableCell>
                  </TableRow>
                ))}
                {/* Add mileage deduction */}
                {totalMileageDeduction > 0 && (
                  <TableRow>
                    <TableCell className="text-sm font-medium">Line 9 (Car)</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Business Mileage ({mileageLogs.reduce((s, m) => s + Number(m.miles || 0), 0).toFixed(1)} mi × $0.70)</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(totalMileageDeduction)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const rows = [["Schedule C Line", "Category", "Amount"]];
                transactions.filter(t => t.type === "expense").forEach(t => {
                  rows.push([t.expense_categories?.irs_schedule_c_line || "", t.expense_categories?.category_name || "", String(t.amount)]);
                });
                if (totalMileageDeduction > 0) rows.push(["Line 9 (Car)", "Business Mileage", String(totalMileageDeduction.toFixed(2))]);
                const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `schedule-c-export-${new Date().getFullYear()}.csv`; a.click();
                URL.revokeObjectURL(url);
                toast.success("Schedule C CSV exported");
              }}><FileText className="h-4 w-4 mr-1" /> Export CSV</Button>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); addExpense.mutate({ amount: Number(fd.get("amount")), description: fd.get("description"), vendor: fd.get("vendor"), category_id: fd.get("category_id") || null, transaction_date: fd.get("date"), type: "expense" }); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount *</Label><Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" /></div>
              <div><Label>Date *</Label><Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            </div>
            <div><Label>Description *</Label><Input name="description" required placeholder="What was this expense for?" /></div>
            <div><Label>Vendor</Label><Input name="vendor" placeholder="e.g., Staples, NNA" /></div>
            <div><Label>Category</Label>
              <Select name="category_id"><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={addExpense.isPending}>{addExpense.isPending ? "Saving..." : "Add Expense"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Mileage Dialog */}
      <Dialog open={showAddMileage} onOpenChange={setShowAddMileage}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Mileage</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); addMileage.mutate({ trip_date: fd.get("date"), origin: fd.get("origin"), destination: fd.get("destination"), miles: Number(fd.get("miles")), purpose: fd.get("purpose") }); }} className="space-y-3">
            <div><Label>Date *</Label><Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From *</Label><Input name="origin" required placeholder="e.g., Home office" /></div>
              <div><Label>To *</Label><Input name="destination" required placeholder="e.g., Client location" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Miles *</Label><Input name="miles" type="number" step="0.1" min="0.1" required placeholder="0.0" /></div>
              <div><Label>Purpose</Label><Input name="purpose" placeholder="e.g., Mobile notarization" /></div>
            </div>
            <p className="text-xs text-muted-foreground">IRS standard rate: $0.70/mile (2026)</p>
            <Button type="submit" className="w-full" disabled={addMileage.isPending}>{addMileage.isPending ? "Saving..." : "Log Trip"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
