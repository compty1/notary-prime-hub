/**
 * SVC-282: Per-service usage dashboard component
 * Shows bookings, completions, and revenue per service type.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Calendar } from "lucide-react";

export function ServiceUsageDashboard() {
  const { data: serviceStats = [] } = useQuery({
    queryKey: ["service-usage-stats"],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("service_type, status")
        .limit(1000);

      if (!appointments) return [];

      const stats: Record<string, { total: number; completed: number; cancelled: number }> = {};
      appointments.forEach((a: any) => {
        if (!stats[a.service_type]) stats[a.service_type] = { total: 0, completed: 0, cancelled: 0 };
        stats[a.service_type].total++;
        if (a.status === "completed" || a.status === "notarized") stats[a.service_type].completed++;
        if (a.status === "cancelled") stats[a.service_type].cancelled++;
      });

      return Object.entries(stats)
        .map(([service, s]) => ({ service, ...s, completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total);
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Service Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {serviceStats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No booking data yet</p>
        ) : (
          <div className="space-y-3">
            {serviceStats.slice(0, 10).map((stat: any) => (
              <div key={stat.service} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="text-sm font-medium">{stat.service}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {stat.total} bookings</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {stat.completionRate}% completion</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{stat.completed}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
