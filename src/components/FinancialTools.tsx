import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, TrendingDown } from "lucide-react";

/** REM-018: Cost Per Notarization Calculator */
export function CPNCalculator({ totalExpenses = 0, totalNotarizations = 0 }: { totalExpenses?: number; totalNotarizations?: number }) {
  const [expenses, setExpenses] = useState(totalExpenses);
  const [notarizations, setNotarizations] = useState(totalNotarizations);

  const cpn = useMemo(() => notarizations > 0 ? expenses / notarizations : 0, [expenses, notarizations]);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Cost Per Notarization</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Total Monthly Expenses ($)</Label><Input type="number" value={expenses} onChange={e => setExpenses(+e.target.value)} min={0} /></div>
          <div><Label>Total Notarizations</Label><Input type="number" value={notarizations} onChange={e => setNotarizations(+e.target.value)} min={0} /></div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Cost Per Notarization</p>
          <p className="text-3xl font-bold">${cpn.toFixed(2)}</p>
          {cpn > 0 && cpn < 5 && <Badge className="mt-2 bg-green-500/10 text-green-700">Below Ohio $5 fee cap ✓</Badge>}
          {cpn >= 5 && <Badge className="mt-2" variant="destructive">Above Ohio $5 fee cap — consider reducing overhead</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

/** REM-019: Amortization Schedule */
export function AmortizationCalculator() {
  const [principal, setPrincipal] = useState(5000);
  const [months, setMonths] = useState(36);

  const monthlyAmount = useMemo(() => months > 0 ? principal / months : 0, [principal, months]);
  const schedule = useMemo(() => {
    const items = [];
    let remaining = principal;
    for (let i = 1; i <= Math.min(months, 60); i++) {
      remaining -= monthlyAmount;
      items.push({ month: i, payment: monthlyAmount, remaining: Math.max(0, remaining) });
    }
    return items;
  }, [principal, months, monthlyAmount]);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Amortization Schedule</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Total Amount ($)</Label><Input type="number" value={principal} onChange={e => setPrincipal(+e.target.value)} min={0} /></div>
          <div><Label>Term (months)</Label><Input type="number" value={months} onChange={e => setMonths(+e.target.value)} min={1} max={120} /></div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Monthly Amount</p>
          <p className="text-2xl font-bold">${monthlyAmount.toFixed(2)}</p>
        </div>
        <div className="max-h-48 overflow-y-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Month</th><th className="p-2 text-right">Payment</th><th className="p-2 text-right">Remaining</th></tr></thead>
            <tbody>{schedule.map(s => <tr key={s.month} className="border-t border-border/50"><td className="p-2">{s.month}</td><td className="p-2 text-right">${s.payment.toFixed(2)}</td><td className="p-2 text-right">${s.remaining.toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/** REM-020: Schedule C Tax Prep Helper */
const SCHEDULE_C_LINES: Record<string, { line: string; label: string }> = {
  "Supplies": { line: "22", label: "Supplies" },
  "Office Expenses": { line: "18", label: "Office Expenses" },
  "Insurance": { line: "15", label: "Insurance" },
  "Software & Technology": { line: "18", label: "Other Expenses" },
  "Travel": { line: "24a", label: "Travel" },
  "Vehicle Expenses": { line: "9", label: "Car & Truck Expenses" },
  "Professional Development": { line: "27a", label: "Other Expenses" },
  "Marketing & Advertising": { line: "8", label: "Advertising" },
  "Legal & Professional": { line: "17", label: "Legal & Professional Services" },
  "Taxes & Licenses": { line: "23", label: "Taxes & Licenses" },
  "Bond & Commission": { line: "23", label: "Taxes & Licenses" },
  "Equipment": { line: "13", label: "Depreciation" },
  "Rent": { line: "20b", label: "Rent - Other" },
  "Utilities": { line: "25", label: "Utilities" },
  "Meals": { line: "24b", label: "Meals (50%)" },
};

export function ScheduleCHelper({ expenses = [] }: { expenses?: Array<{ category: string; amount: number }> }) {
  const grouped = useMemo(() => {
    const map: Record<string, { line: string; label: string; total: number }> = {};
    for (const exp of expenses) {
      const mapping = SCHEDULE_C_LINES[exp.category] || { line: "27a", label: "Other Expenses" };
      const key = mapping.line;
      if (!map[key]) map[key] = { ...mapping, total: 0 };
      map[key].total += exp.amount;
    }
    return Object.values(map).sort((a, b) => a.line.localeCompare(b.line));
  }, [expenses]);

  const total = grouped.reduce((s, g) => s + g.total, 0);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Schedule C Summary</CardTitle></CardHeader>
      <CardContent>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Add expenses to see Schedule C line item mapping</p>
        ) : (
          <div className="space-y-2">
            {grouped.map(g => (
              <div key={g.line} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <span className="text-xs font-mono text-muted-foreground">Line {g.line}</span>
                  <p className="text-sm font-medium">{g.label}</p>
                </div>
                <span className="font-bold">${g.total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 mt-2">
              <span className="font-semibold">Total Deductions</span>
              <span className="text-lg font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
