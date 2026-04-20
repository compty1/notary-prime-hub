import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Car, Plus, TrendingUp, TrendingDown, Download } from "lucide-react";
import { format } from "date-fns";

const EXPENSE_CATEGORIES = [
  "advertising", "car_truck", "commissions", "contract_labor", "depreciation",
  "employee_benefits", "insurance", "interest", "legal_professional", "office_expense",
  "rent_lease", "repairs_maintenance", "supplies", "taxes_licenses", "travel",
  "meals", "utilities", "wages", "other"
];

export default function AdminAccounting() {
  usePageMeta({ title: "Accounting & Tax Center" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [txOpen, setTxOpen] = useState(false);
  const [mileOpen, setMileOpen] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ["accounting_transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("accounting_transactions").select("*").order("transaction_date", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: mileage = [] } = useQuery({
    queryKey: ["mileage_entries"],
    queryFn: async () => {
      const { data } = await supabase.from("mileage_entries").select("*").order("trip_date", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const addTx = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("accounting_transactions").insert({
        user_id: user!.id,
        description: form.get("description") as string,
        amount: parseFloat(form.get("amount") as string),
        transaction_type: form.get("type") as string,
        category: form.get("category") as string,
        transaction_date: form.get("date") as string,
        tax_deductible: form.get("deductible") === "on",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounting_transactions"] }); toast.success("Transaction added"); setTxOpen(false); },
    onError: () => toast.error("Failed to add transaction"),
  });

  const addMile = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("mileage_entries").insert({
        user_id: user!.id,
        trip_date: form.get("date") as string,
        start_address: form.get("start") as string,
        end_address: form.get("end") as string,
        miles: parseFloat(form.get("miles") as string),
        purpose: form.get("purpose") as string,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mileage_entries"] }); toast.success("Mileage logged"); setMileOpen(false); },
    onError: () => toast.error("Failed to log mileage"),
  });

  const totalIncome = transactions.filter(t => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalMileDeduction = mileage.reduce((s, m) => s + Number(m.deduction_amount || 0), 0);

  const exportCSV = () => {
    const rows = [["Date","Type","Category","Description","Amount","Tax Deductible"], ...transactions.map(t => [t.transaction_date, t.transaction_type, t.category, t.description, t.amount, t.tax_deductible ? "Yes" : "No"])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `accounting_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounting & Tax Center</h1>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success flex items-center gap-1"><TrendingUp className="h-5 w-5" />${totalIncome.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive flex items-center gap-1"><TrendingDown className="h-5 w-5" />${totalExpenses.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Profit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${(totalIncome - totalExpenses).toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mileage Deduction</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-info flex items-center gap-1"><Car className="h-5 w-5" />${totalMileDeduction.toFixed(2)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions"><DollarSign className="h-3.5 w-3.5 mr-1" />Transactions</TabsTrigger>
          <TabsTrigger value="mileage"><Car className="h-3.5 w-3.5 mr-1" />Mileage</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Dialog open={txOpen} onOpenChange={setTxOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Transaction</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addTx.mutate(new FormData(e.currentTarget)); }} className="space-y-3">
                <div><Label>Description</Label><Input name="description" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount ($)</Label><Input name="amount" type="number" step="0.01" required /></div>
                  <div><Label>Type</Label><Select name="type" defaultValue="expense"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label><Select name="category" defaultValue="other"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Date</Label><Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required /></div>
                </div>
                <div className="flex items-center gap-2"><Switch name="deductible" /><Label>Tax Deductible</Label></div>
                <Button type="submit" className="w-full" disabled={addTx.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">Description</th><th className="text-left p-3">Category</th><th className="text-right p-3">Amount</th><th className="text-center p-3">Tax</th></tr></thead>
              <tbody>{transactions.map(t => (
                <tr key={t.id} className="border-t hover:bg-muted/20">
                  <td className="p-3">{t.transaction_date}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3 capitalize">{t.category?.replace(/_/g, " ")}</td>
                  <td className={`p-3 text-right font-medium ${t.transaction_type === "income" ? "text-success" : "text-destructive"}`}>{t.transaction_type === "income" ? "+" : "-"}${Number(t.amount).toFixed(2)}</td>
                  <td className="p-3 text-center">{t.tax_deductible && <Badge variant="secondary">Deductible</Badge>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mileage" className="space-y-4">
          <Dialog open={mileOpen} onOpenChange={setMileOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Log Mileage</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Mileage Trip</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addMile.mutate(new FormData(e.currentTarget)); }} className="space-y-3">
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required /></div>
                <div><Label>Start Address</Label><Input name="start" required /></div>
                <div><Label>End Address</Label><Input name="end" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Miles</Label><Input name="miles" type="number" step="0.1" required /></div>
                  <div><Label>Purpose</Label><Input name="purpose" placeholder="Client meeting..." /></div>
                </div>
                <p className="text-xs text-muted-foreground">IRS rate: $0.70/mile (2025)</p>
                <Button type="submit" className="w-full" disabled={addMile.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">From</th><th className="text-left p-3">To</th><th className="text-right p-3">Miles</th><th className="text-right p-3">Deduction</th><th className="text-left p-3">Purpose</th></tr></thead>
              <tbody>{mileage.map(m => (
                <tr key={m.id} className="border-t hover:bg-muted/20">
                  <td className="p-3">{m.trip_date}</td>
                  <td className="p-3 truncate max-w-[150px]">{m.start_address}</td>
                  <td className="p-3 truncate max-w-[150px]">{m.end_address}</td>
                  <td className="p-3 text-right">{Number(m.miles).toFixed(1)}</td>
                  <td className="p-3 text-right text-info">${Number(m.deduction_amount || 0).toFixed(2)}</td>
                  <td className="p-3">{m.purpose}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
