import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Receipt, Download } from "lucide-react";
import { motion } from "framer-motion";

const getDateRange = (range: string) => {
  const now = new Date();
  const start = new Date();
  switch (range) {
    case "week": start.setDate(now.getDate() - 7); break;
    case "month": start.setMonth(now.getMonth() - 1); break;
    case "quarter": start.setMonth(now.getMonth() - 3); break;
    case "year": start.setFullYear(now.getFullYear() - 1); break;
    default: return null;
  }
  return start.toISOString();
};

export default function AdminRevenue() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("notary_journal").select("*").order("created_at", { ascending: false });
      const rangeStart = getDateRange(dateRange);
      if (rangeStart) query = query.gte("created_at", rangeStart);
      const { data } = await query;
      if (data) setEntries(data);
      setLoading(false);
    };
    fetchData();
  }, [dateRange]);

  const filtered = typeFilter === "all" ? entries : entries.filter((e) => e.notarization_type === typeFilter);

  const totalRevenue = filtered.reduce((sum, e) => sum + (parseFloat(e.fees_charged) || 0), 0);
  const totalPlatformFees = filtered.reduce((sum, e) => sum + (parseFloat(e.platform_fees) || 0), 0);
  const totalTravelFees = filtered.reduce((sum, e) => sum + (parseFloat(e.travel_fee) || 0), 0);
  const totalExpenses = totalPlatformFees + totalTravelFees;
  const netProfit = totalRevenue - totalExpenses;
  const avgPerSession = filtered.length > 0 ? netProfit / filtered.length : 0;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const exportCSV = () => {
    const headers = ["Date", "Client", "Service", "Type", "Fee", "Platform Fees", "Travel Fee", "Net Profit"];
    const rows = filtered.map((e) => {
      const fee = parseFloat(e.fees_charged) || 0;
      const platform = parseFloat(e.platform_fees) || 0;
      const travel = parseFloat(e.travel_fee) || 0;
      return [formatDate(e.created_at), e.signer_name, e.document_type, e.notarization_type, fee.toFixed(2), platform.toFixed(2), travel.toFixed(2), (fee - platform - travel).toFixed(2)];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `revenue_${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-blue-600" },
    { label: "Total Expenses", value: `$${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: "text-red-500" },
    { label: "Net Profit", value: `$${netProfit.toFixed(2)}`, icon: TrendingUp, color: netProfit >= 0 ? "text-emerald-600" : "text-red-600" },
    { label: "Avg Profit/Session", value: `$${avgPerSession.toFixed(2)}`, icon: Receipt, color: "text-accent" },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Revenue & Profit</h1>
          <p className="text-sm text-muted-foreground">Track earnings, expenses, and net profit per session</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="mr-1 h-3 w-3" /> CSV
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card className="border-border/50">
        <CardHeader><CardTitle className="font-display text-lg">Per-Session Breakdown</CardTitle></CardHeader>
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
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Travel</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Profit</th>
                </tr></thead>
                <tbody>
                  {filtered.map((entry) => {
                    const fee = parseFloat(entry.fees_charged) || 0;
                    const platform = parseFloat(entry.platform_fees) || 0;
                    const travel = parseFloat(entry.travel_fee) || 0;
                    const net = fee - platform - travel;
                    return (
                      <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">{formatDate(entry.created_at)}</td>
                        <td className="px-4 py-3 font-medium">{entry.signer_name}</td>
                        <td className="px-4 py-3">{entry.document_type}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{entry.notarization_type === "ron" ? "RON" : "In-Person"}</Badge></td>
                        <td className="px-4 py-3 text-right">${fee.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${platform.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${travel.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${net >= 0 ? "text-emerald-600" : "text-destructive"}`}>${net.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
