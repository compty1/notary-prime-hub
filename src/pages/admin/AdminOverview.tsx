import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, DollarSign, Plus, BookMarked, FileText, AlertTriangle, Video } from "lucide-react";
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

const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export default function AdminOverview() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, clients: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [commissionAlert, setCommissionAlert] = useState<{ tone: string; text: string } | null>(null);
  const [eoAlert, setEoAlert] = useState<string | null>(null);
  const [bondAlert, setBondAlert] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: totalAppts },
        { count: upcomingCount },
        { count: completedCount },
        { count: clientCount },
        { data: recentAppts },
        { data: journalData },
        { data: settingsData },
      ] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).in("status", ["scheduled", "confirmed"]),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }).limit(10),
        supabase.from("notary_journal").select("fees_charged"),
        supabase.from("platform_settings").select("setting_key, setting_value"),
      ]);

      const totalRevenue = (journalData || []).reduce((sum: number, j: any) => sum + (parseFloat(j.fees_charged) || 0), 0);
      if (recentAppts) setAppointments(recentAppts);
      setStats({ total: totalAppts || 0, upcoming: upcomingCount || 0, completed: completedCount || 0, clients: clientCount || 0, revenue: totalRevenue });

      // Check commission/E&O/bond expiration
      if (settingsData) {
        const s: Record<string, string> = {};
        settingsData.forEach((item: any) => { s[item.setting_key] = item.setting_value; });
        const now = new Date();
        const checkExpiry = (dateStr: string | undefined, reminderDays: number) => {
          if (!dateStr) return null;
          const exp = new Date(dateStr);
          const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (days < 0) return { tone: "destructive", text: `Expired ${Math.abs(days)} days ago` };
          if (days <= reminderDays) return { tone: "warning", text: `Expires in ${days} days` };
          return null;
        };
        const commResult = checkExpiry(s.commission_expiration_date, parseInt(s.commission_renewal_reminder_days || "90"));
        if (commResult) setCommissionAlert({ tone: commResult.tone === "destructive" ? "border-destructive bg-destructive/10 text-destructive" : "border-amber-500 bg-amber-50 text-amber-800", text: `Commission: ${commResult.text}` });
        const eoResult = checkExpiry(s.eo_expiration_date, 60);
        if (eoResult) setEoAlert(`E&O Insurance: ${eoResult.text}`);
        const bondResult = checkExpiry(s.bond_expiration_date, 60);
        if (bondResult) setBondAlert(`Surety Bond: ${bondResult.text}`);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Appointments", value: stats.total, icon: Calendar, color: "text-blue-600" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-amber-600" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Clients", value: stats.clients, icon: Users, color: "text-purple-600" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-accent" },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Overview</h1>
      </div>

      {/* Commission / E&O / Bond Alert Banners */}
      {(commissionAlert || eoAlert || bondAlert) && (
        <div className="mb-6 space-y-2">
          {commissionAlert && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${commissionAlert.tone}`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {commissionAlert.text}
              <Link to="/admin/settings" className="ml-auto"><Button size="sm" variant="outline" className="text-xs">Update Settings</Button></Link>
            </div>
          )}
          {eoAlert && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {eoAlert}
            </div>
          )}
          {bondAlert && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {bondAlert}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link to="/admin/appointments"><Button size="sm" variant="outline"><Calendar className="mr-1 h-3 w-3" /> Today's Appointments</Button></Link>
        <Link to="/admin/journal"><Button size="sm" variant="outline"><BookMarked className="mr-1 h-3 w-3" /> New Journal Entry</Button></Link>
        <Link to="/admin/documents"><Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" /> Review Documents</Button></Link>
        <Link to="/admin/availability"><Button size="sm" variant="outline"><Clock className="mr-1 h-3 w-3" /> Set Availability</Button></Link>
        {appointments.filter(a => a.notarization_type === "ron" && ["kba_pending", "in_session"].includes(a.status)).length > 0 && (
          <Link to={`/ron-session?id=${appointments.find(a => a.notarization_type === "ron" && ["kba_pending", "in_session"].includes(a.status))?.id}`}>
            <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700"><Video className="mr-1 h-3 w-3" /> Launch RON Session</Button>
          </Link>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Appointments</h2>
      {appointments.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">No appointments yet</CardContent></Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{formatDate(a.scheduled_date)}</td>
                      <td className="px-4 py-3">{formatTime(a.scheduled_time)}</td>
                      <td className="px-4 py-3 font-medium">{a.service_type}</td>
                      <td className="px-4 py-3 capitalize">{a.notarization_type.replace("_", " ")}</td>
                      <td className="px-4 py-3"><Badge className={statusColors[a.status] || "bg-muted"}>{a.status.replace(/_/g, " ")}</Badge></td>
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
