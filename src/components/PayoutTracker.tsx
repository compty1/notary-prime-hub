import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";

export function PayoutTracker() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profit_share_transactions").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setPayouts(data || []); setLoading(false); });
  }, []);

  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.professional_share || 0), 0);
  const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.professional_share || 0), 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Payouts</p>
          <p className="text-2xl font-bold">{payouts.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Paid Out</p>
          <p className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Profit Share Transactions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Gross</TableHead><TableHead>Platform Fee</TableHead><TableHead>Pro Share</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No payout transactions yet</TableCell></TableRow>
              ) : payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(p.gross_amount || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">${Number(p.platform_fee || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${Number(p.professional_share || 0).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
