import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, FileText } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

type KPI = {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
};

export function OperationalKPIDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const thirtyDaysAgo = format(subDays(now, 30), "yyyy-MM-dd");
      const sixtyDaysAgo = format(subDays(now, 60), "yyyy-MM-dd");

      // Current period appointments
      const { count: currentAppts } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);

      // Previous period
      const { count: prevAppts } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sixtyDaysAgo)
        .lt("created_at", thirtyDaysAgo);

      // Completed appointments
      const { count: completed } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed" as any)
        .gte("created_at", thirtyDaysAgo);

      // Active clients
      const { count: activeClients } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Documents processed
      const { count: docsProcessed } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);

      // Revenue (payments)
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte("created_at", thirtyDaysAgo);

      const revenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;

      const apptChange = prevAppts && prevAppts > 0
        ? Math.round(((currentAppts ?? 0) - prevAppts) / prevAppts * 100)
        : 0;

      const completionRate = currentAppts && currentAppts > 0
        ? Math.round(((completed ?? 0) / currentAppts) * 100)
        : 0;

      setKpis([
        { label: "Appointments (30d)", value: String(currentAppts ?? 0), change: apptChange, icon: <Calendar className="h-4 w-4" /> },
        { label: "Completion Rate", value: `${completionRate}%`, icon: <TrendingUp className="h-4 w-4" /> },
        { label: "Revenue (30d)", value: `$${revenue.toLocaleString()}`, icon: <DollarSign className="h-4 w-4" /> },
        { label: "Active Clients", value: String(activeClients ?? 0), icon: <Users className="h-4 w-4" /> },
        { label: "Documents (30d)", value: String(docsProcessed ?? 0), icon: <FileText className="h-4 w-4" /> },
      ]);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading KPIs...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {kpi.icon}
              <span className="text-xs">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{kpi.value}</span>
              {kpi.change !== undefined && kpi.change !== 0 && (
                <Badge variant="outline" className={`text-[10px] ${kpi.change > 0 ? "text-green-600" : "text-red-600"}`}>
                  {kpi.change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {Math.abs(kpi.change)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
