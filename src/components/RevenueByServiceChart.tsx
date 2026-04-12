import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];

interface Props {
  entries: any[];
}

export function RevenueByServiceChart({ entries }: Props) {
  const data = useMemo(() => {
    const byService: Record<string, number> = {};
    entries.forEach(e => {
      const svc = e.document_type || e.service_type || "Other";
      byService[svc] = (byService[svc] || 0) + (parseFloat(e.fees_charged) || parseFloat(e.amount) || 0);
    });
    return Object.entries(byService)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [entries]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Revenue by Service Type</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
