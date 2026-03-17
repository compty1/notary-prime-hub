import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  id_verification: "bg-yellow-100 text-yellow-800",
  kba_pending: "bg-orange-100 text-orange-800",
  in_session: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function AdminOverview() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, clients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: appts } = await supabase.from("appointments").select("*").order("scheduled_date", { ascending: true }).limit(20);
      const { count: clientCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      if (appts) {
        setAppointments(appts);
        setStats({
          total: appts.length,
          upcoming: appts.filter((a) => ["scheduled", "confirmed"].includes(a.status)).length,
          completed: appts.filter((a) => a.status === "completed").length,
          clients: clientCount || 0,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Total Appointments", value: stats.total, icon: Calendar, color: "text-blue-600" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-amber-600" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Clients", value: stats.clients, icon: Users, color: "text-purple-600" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Dashboard Overview</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Appointments</h2>
      {appointments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">No appointments yet</CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{a.scheduled_date}</td>
                      <td className="px-4 py-3">{a.scheduled_time}</td>
                      <td className="px-4 py-3 font-medium">{a.service_type}</td>
                      <td className="px-4 py-3 capitalize">{a.notarization_type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[a.status] || "bg-muted"}>{a.status.replace(/_/g, " ")}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
