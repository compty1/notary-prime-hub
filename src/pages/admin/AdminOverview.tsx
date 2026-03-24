import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, DollarSign, Plus, BookMarked, FileText, AlertTriangle, Video, RefreshCw, ScrollText } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

const CHART_COLORS = ["#2563eb", "#d4a853", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function AdminOverview() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, clients: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [commissionAlert, setCommissionAlert] = useState<{ tone: string; text: string } | null>(null);
  const [eoAlert, setEoAlert] = useState<string | null>(null);
  const [bondAlert, setBondAlert] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [
      { count: totalAppts },
      { count: upcomingCount },
      { count: completedCount },
      { count: clientCount },
      { data: recentAppts },
      { data: journalData },
      { data: settingsData },
      { data: profileData },
      { data: allApptData },
    ] = await Promise.all([
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }).in("status", ["scheduled", "confirmed"]),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }).limit(10),
      supabase.from("notary_journal").select("fees_charged, created_at, notarization_type"),
      supabase.from("platform_settings").select("setting_key, setting_value"),
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("appointments").select("scheduled_date, status, notarization_type").order("scheduled_date", { ascending: true }),
    ]);

    // Fetch recent audit activity
    const { data: activityData } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(10);
    if (activityData) setRecentActivity(activityData);

    // Build profiles map
    if (profileData) {
      const map: Record<string, string> = {};
      profileData.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || p.user_id.slice(0, 8); });
      setProfiles(map);
    }

    const totalRevenue = (journalData || []).reduce((sum: number, j: any) => sum + (parseFloat(j.fees_charged) || 0), 0);
    if (recentAppts) setAppointments(recentAppts);
    if (journalData) setJournalEntries(journalData);
    if (allApptData) setAllAppointments(allApptData);
    setStats({ total: totalAppts || 0, upcoming: upcomingCount || 0, completed: completedCount || 0, clients: clientCount || 0, revenue: totalRevenue });

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
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getClientName = (clientId: string) => profiles[clientId] || "Unknown";

  const today = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter(a => a.scheduled_date === today && !["cancelled", "no_show"].includes(a.status)).length;

  // Chart data: appointments per month
  const monthlyAppointments = useMemo(() => {
    const months: Record<string, number> = {};
    allAppointments.forEach(a => {
      const month = a.scheduled_date?.slice(0, 7); // YYYY-MM
      if (month) months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      appointments: count,
    }));
  }, [allAppointments]);

  // Chart data: revenue per month
  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    journalEntries.forEach(j => {
      const month = j.created_at?.slice(0, 7);
      if (month) months[month] = (months[month] || 0) + (parseFloat(j.fees_charged) || 0);
    });
    return Object.entries(months).slice(-6).map(([month, revenue]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      revenue,
    }));
  }, [journalEntries]);

  // Chart data: status breakdown pie
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allAppointments.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({ name: status.replace(/_/g, " "), value }));
  }, [allAppointments]);

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
        <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
      </div>

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

      <div className="mb-6 flex flex-wrap gap-2">
        <Link to={`/admin/appointments`}><Button size="sm" variant="outline"><Calendar className="mr-1 h-3 w-3" /> Today's Appointments {todayCount > 0 && `(${todayCount})`}</Button></Link>
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

      {/* Analytics Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Appointments by Month</CardTitle></CardHeader>
          <CardContent>
            {monthlyAppointments.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-muted-foreground" /> Recent Activity
            </h2>
            <Link to="/admin/audit-log"><Button variant="ghost" size="sm" className="text-xs">View All →</Button></Link>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Badge className="text-xs bg-muted text-muted-foreground">{log.action.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{log.entity_type || ""}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Appointments</h2>
      {appointments.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">No appointments yet</CardContent></Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{getClientName(a.client_id)}</td>
                      <td className="px-4 py-3">{formatDate(a.scheduled_date)}</td>
                      <td className="px-4 py-3">{formatTime(a.scheduled_time)}</td>
                      <td className="px-4 py-3">{a.service_type}</td>
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
