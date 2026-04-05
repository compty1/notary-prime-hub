import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function RevenueForecast() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("payments")
      .select("amount, created_at, status")
      .eq("status", "paid")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setPayments(data || []);
        setLoading(false);
      });
  }, []);

  const { chartData, forecast } = useMemo(() => {
    if (payments.length === 0) return { chartData: [], forecast: { next1: 0, next2: 0, next3: 0 } };

    // Group by month
    const monthMap: Record<string, number> = {};
    payments.forEach((p) => {
      const month = p.created_at.substring(0, 7); // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + Number(p.amount || 0);
    });

    const months = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue], i) => ({ month, revenue, index: i }));

    // Simple linear regression
    const n = months.length;
    if (n < 2) return { chartData: months.map((m) => ({ ...m, forecast: null })), forecast: { next1: 0, next2: 0, next3: 0 } };

    const sumX = months.reduce((s, m) => s + m.index, 0);
    const sumY = months.reduce((s, m) => s + m.revenue, 0);
    const sumXY = months.reduce((s, m) => s + m.index * m.revenue, 0);
    const sumX2 = months.reduce((s, m) => s + m.index * m.index, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predict = (i: number) => Math.max(0, Math.round(intercept + slope * i));

    // Add forecast months
    const lastDate = new Date(months[n - 1].month + "-01");
    const forecastMonths = [];
    for (let j = 1; j <= 3; j++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + j);
      forecastMonths.push({
        month: d.toISOString().substring(0, 7),
        revenue: null,
        forecast: predict(n - 1 + j),
        index: n - 1 + j,
      });
    }

    const chartData = [
      ...months.map((m) => ({ ...m, forecast: predict(m.index) })),
      ...forecastMonths,
    ];

    return {
      chartData,
      forecast: {
        next1: forecastMonths[0]?.forecast || 0,
        next2: forecastMonths[1]?.forecast || 0,
        next3: forecastMonths[2]?.forecast || 0,
      },
    };
  }, [payments]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Total Revenue
            </div>
            <div className="mt-1 text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Next Month Forecast
            </div>
            <div className="mt-1 text-2xl font-bold">${forecast.next1.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> 3-Month Forecast
            </div>
            <div className="mt-1 text-2xl font-bold">
              ${(forecast.next1 + forecast.next2 + forecast.next3).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Revenue Trend & Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Actual Revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="hsl(var(--primary) / 0.5)"
                  fill="hsl(var(--primary) / 0.05)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payment data available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
