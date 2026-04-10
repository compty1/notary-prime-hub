import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState, useCallback, useMemo } from "react";
import { OverviewSkeleton } from "@/components/AdminLoadingSkeleton";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Users, CheckCircle, Clock, DollarSign, Plus, BookMarked, FileText, AlertTriangle, Video, RefreshCw, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getEdgeFunctionHeaders } from "@/lib/edgeFunctionAuth";
import GoogleCalendarWidget from "@/components/GoogleCalendarWidget";

import { appointmentStatusColors as statusColors } from "@/lib/statusColors";

import { formatDate, formatTime } from "@/lib/utils";

const CHART_COLORS = ["hsl(224, 63%, 28%)", "hsl(168, 75%, 36%)", "hsl(42, 78%, 55%)", "hsl(0, 85%, 55%)", "hsl(261, 50%, 51%)", "hsl(190, 95%, 39%)", "hsl(30, 95%, 53%)", "hsl(140, 60%, 40%)"];

// #3422: Time-of-day greeting
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface OverviewAppointment {
  id: string;
  client_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  service_type: string;
  notarization_type: string;
  confirmation_number: string | null;
}

interface PaymentRow { amount: number; status: string; created_at?: string; fees_charged?: number; }
interface SettingRow { setting_key: string; setting_value: string; }
interface ProfileRow { user_id: string; full_name: string | null; email: string | null; }
interface AllApptRow { id: string; scheduled_date: string; scheduled_time: string; status: string; notarization_type: string; client_id: string; service_type: string; confirmation_number: string | null; }
interface AuditRow { id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string; user_id: string | null; }

export default function AdminOverview() {
  usePageMeta({ title: "Overview", noIndex: true });
  const greeting = getGreeting();
  const [appointments, setAppointments] = useState<OverviewAppointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<AllApptRow[]>([]);
  const [journalEntries, setJournalEntries] = useState<PaymentRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, clients: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commissionAlert, setCommissionAlert] = useState<{ tone: string; text: string } | null>(null);
  const [eoAlert, setEoAlert] = useState<string | null>(null);
  const [bondAlert, setBondAlert] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoadError(null);
    const timeout = setTimeout(() => {
      setLoadError("Loading is taking longer than expected. Please check your connection.");
      setLoading(false);
    }, 15000);

    try {
      const results = await Promise.allSettled([
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).in("status", ["scheduled", "confirmed"]),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id, client_id, scheduled_date, scheduled_time, status, service_type, notarization_type, confirmation_number").order("scheduled_date", { ascending: false }).limit(10),
        supabase.from("payments").select("amount, status").eq("status", "paid"),
        supabase.from("platform_settings").select("setting_key, setting_value"),
        supabase.from("profiles").select("user_id, full_name, email").limit(2000),
        supabase.from("appointments").select("scheduled_date, status, notarization_type, client_id").order("scheduled_date", { ascending: true }).gte("scheduled_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]).limit(1000),
      ]);

      clearTimeout(timeout);

      const getValue = <T,>(idx: number, key: string): T | null => {
        const r = results[idx];
        if (r.status === "fulfilled") return (r.value as Record<string, unknown>)[key] as T;
        return null;
      };

      const totalAppts = getValue<number>(0, "count") || 0;
      const upcomingCount = getValue<number>(1, "count") || 0;
      const completedCount = getValue<number>(2, "count") || 0;
      const clientCount = getValue<number>(3, "count") || 0;
      const recentAppts = getValue<OverviewAppointment[]>(4, "data");
      const paymentData = getValue<PaymentRow[]>(5, "data");
      const settingsData = getValue<SettingRow[]>(6, "data");
      const profileData = getValue<ProfileRow[]>(7, "data");
      const allApptData = getValue<AllApptRow[]>(8, "data");

      // Fetch recent audit activity
      const { data: activityData } = await supabase.from("audit_log").select("id, action, entity_type, entity_id, created_at, user_id").order("created_at", { ascending: false }).limit(10);
      if (activityData) setRecentActivity(activityData);

      // Build profiles map
      if (profileData) {
        const map: Record<string, string> = {};
        profileData.forEach((p) => { map[p.user_id] = p.full_name || p.email || p.user_id.slice(0, 8); });
        setProfiles(map);
      }

      const totalRevenue = (paymentData || []).reduce((sum: number, j) => sum + (Number(j.amount) || 0), 0);
      if (recentAppts) setAppointments(recentAppts);
      if (paymentData) setJournalEntries(paymentData);
      if (allApptData) setAllAppointments(allApptData);
      const uniqueClients = new Set((allApptData || []).map((a) => a.client_id).filter(Boolean));
      setStats({ total: totalAppts, upcoming: upcomingCount, completed: completedCount, clients: uniqueClients.size || clientCount, revenue: totalRevenue });

      if (settingsData) {
        const s: Record<string, string> = {};
        settingsData.forEach((item) => { s[item.setting_key] = item.setting_value; });
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
        if (commResult) setCommissionAlert({ tone: commResult.tone === "destructive" ? "border-destructive bg-destructive/10 text-destructive" : "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300", text: `Commission: ${commResult.text}` });
        const eoResult = checkExpiry(s.eo_expiration_date, 60);
        if (eoResult) setEoAlert(`E&O Insurance: ${eoResult.text}`);
        const bondResult = checkExpiry(s.bond_expiration_date, 60);
        if (bondResult) setBondAlert(`Surety Bond: ${bondResult.text}`);
      }
    } catch (err) {
      console.error("AdminOverview fetch error:", err);
      setLoadError("Failed to load dashboard data. Please try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds, only when tab is visible (Bug 172)
    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, 60000);
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
      if (month) months[month] = (months[month] || 0) + (parseFloat(String(j.fees_charged)) || 0);
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
    { label: "Total Appointments", value: stats.total, icon: CalendarIcon, color: "text-blue-600", link: "/admin/appointments" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-amber-600", link: "/admin/appointments?status=scheduled" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-primary", link: "/admin/appointments?status=completed" },
    { label: "Clients", value: stats.clients, icon: Users, color: "text-purple-600", link: "/admin/clients" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-primary", link: "/admin/revenue" },
  ];

  // Live Calendar Widget — shows week view of appointments + Google Calendar events
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
  });
  interface GCalEvent { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; }
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(calendarWeekStart); d.setDate(d.getDate() + i); return d;
    });
  }, [calendarWeekStart]);

  const shiftWeek = (dir: number) => {
    setCalendarWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + dir * 7); return d; });
  };

  // Fetch Google Calendar events for the week (debounced — Bug 173)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const timeMin = calendarWeekStart.toISOString();
        const end = new Date(calendarWeekStart); end.setDate(end.getDate() + 7);
        const res = await supabase.functions.invoke("google-calendar-sync", {
          body: { action: "list_events", timeMin, timeMax: end.toISOString() },
        });
        if (res.data?.connected) {
          setGcalConnected(true);
          setGcalEvents(res.data.events || []);
        } else {
          setGcalConnected(false);
        }
      } catch { setGcalConnected(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [calendarWeekStart]);

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return allAppointments.filter(a => a.scheduled_date === dateStr && !["cancelled", "no_show"].includes(a.status));
  };

  const getGcalForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return gcalEvents.filter((e) => {
      const start = e.start?.dateTime || e.start?.date || "";
      return start.startsWith(dateStr);
    });
  };

  if (loading) return <OverviewSkeleton />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}, Admin 👋</p>
          <h1 className="text-3xl font-black text-foreground">Dashboard Overview</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="rounded-xl"><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
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
             <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm font-medium text-amber-800 dark:text-amber-300">
               <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {eoAlert}
             </div>
           )}
           {bondAlert && (
             <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm font-medium text-amber-800 dark:text-amber-300">
               <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {bondAlert}
             </div>
           )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link to={`/admin/appointments`}><Button size="sm" variant="outline"><CalendarIcon className="mr-1 h-3 w-3" /> Today's Appointments {todayCount > 0 && `(${todayCount})`}</Button></Link>
        <Link to="/admin/journal"><Button size="sm" variant="outline"><BookMarked className="mr-1 h-3 w-3" /> New Journal Entry</Button></Link>
        <Link to="/admin/documents"><Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" /> Review Documents</Button></Link>
        <Link to="/admin/availability"><Button size="sm" variant="outline"><Clock className="mr-1 h-3 w-3" /> Set Availability</Button></Link>
        {appointments.filter(a => a.notarization_type === "ron" && ["kba_pending", "in_session"].includes(a.status)).length > 0 && (
          <Link to={`/ron-session?id=${appointments.find(a => a.notarization_type === "ron" && ["kba_pending", "in_session"].includes(a.status))?.id}`}>
            <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700"><Video className="mr-1 h-3 w-3" /> Launch RON Session</Button>
          </Link>
        )}
      </div>

      {/* Live Calendar Widget */}
      <div className="mb-8">
        <Card className="rounded-[24px] border-gray-100 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Weekly Calendar
                {gcalConnected && <Badge variant="outline" className="text-xs text-primary">Google Calendar Connected</Badge>}
                {gcalConnected === false && <Badge variant="outline" className="text-xs text-muted-foreground">Google Calendar: Not Connected</Badge>}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => shiftWeek(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); setCalendarWeekStart(d); }}>Today</Button>
                <Button variant="ghost" size="sm" onClick={() => shiftWeek(1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const dayAppts = getAppointmentsForDay(day);
                const dayGcal = getGcalForDay(day);
                return (
                  <div key={day.toISOString()} className={`rounded-lg border p-2 min-h-[100px] ${isToday ? "border-primary bg-primary/5" : "border-border/50"}`}>
                    <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <div className="space-y-1">
                      {dayAppts.map(a => (
                        <div key={a.id} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary truncate" title={`${a.service_type} - ${a.status}`}>
                          {a.scheduled_time?.slice(0,5)} {a.service_type?.slice(0,15)}
                        </div>
                      ))}
                      {dayGcal.map((e: any, i: number) => (
                        <div key={i} className="rounded bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-300 truncate" title={e.summary}>
                          {e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "All day"} {e.summary?.slice(0,12)}
                        </div>
                      ))}
                      {dayAppts.length === 0 && dayGcal.length === 0 && <p className="text-[10px] text-muted-foreground/50">—</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={s.link}>
              <Card className="rounded-[24px] border-gray-100 hover:shadow-md transition-all cursor-pointer bg-white">
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 mb-3"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                  <p className="text-4xl font-black text-[#212529]">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[24px] border-gray-100 bg-white lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-400">Appointments by Month</CardTitle></CardHeader>
          <CardContent>
            {monthlyAppointments.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, fontSize: 12 }} />
                  <Bar dataKey="appointments" fill="#eab308" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-gray-400">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-gray-100 bg-white lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-400">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#212529" strokeWidth={2} dot={{ fill: "#eab308", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-gray-400">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-gray-100 bg-white lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="py-10 text-center text-sm text-gray-400">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Google Calendar Integration Widget */}
      <div className="mb-8">
        <GoogleCalendarWidget />
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#212529] flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-gray-400" /> Recent Activity
            </h2>
            <Link to="/admin/audit-log"><Button variant="ghost" size="sm" className="text-xs rounded-xl">View All →</Button></Link>
          </div>
          <Card className="rounded-[24px] border-gray-100 bg-white">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Badge className="text-xs bg-gray-100 text-gray-600 rounded-lg">{log.action.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-gray-400">{log.entity_type || ""}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Schedule */}
      {(() => {
        const todayAppts = allAppointments.filter(a => a.scheduled_date === today && !["cancelled", "no_show"].includes(a.status));
        return todayAppts.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-black text-[#212529] flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Today's Schedule ({todayAppts.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {todayAppts.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || "")).map((a) => (
                <Card key={a.id} className="rounded-[24px] border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black text-[#212529]">{formatTime(a.scheduled_time || "00:00")}</span>
                      <Badge className={`${statusColors[a.status] || "bg-gray-100"} rounded-lg text-xs`}>{a.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm font-bold text-foreground">{getClientName(a.client_id)}</p>
                    <p className="text-xs text-muted-foreground">{a.service_type} • {(a.notarization_type || "").replace("_", " ")}</p>
                    {a.confirmation_number && <p className="text-[10px] font-mono text-muted-foreground mt-1">{a.confirmation_number}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      <h2 className="mb-4 text-lg font-black text-[#212529]">Recent Appointments</h2>
      {appointments.length === 0 ? (
        <Card className="rounded-[24px] border-gray-100 bg-white"><CardContent className="py-8 text-center text-gray-400">No appointments yet</CardContent></Card>
      ) : (
        <Card className="rounded-[24px] border-gray-100 bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead><tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Client</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Service</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                </tr></thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-bold text-[#212529]">{getClientName(a.client_id)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(a.scheduled_date)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatTime(a.scheduled_time)}</td>
                      <td className="px-5 py-3 text-gray-600">{a.service_type}</td>
                      <td className="px-5 py-3 capitalize text-gray-600">{(a.notarization_type || "").replace("_", " ")}</td>
                      <td className="px-5 py-3"><Badge className={`${statusColors[a.status] || "bg-gray-100"} rounded-lg`}>{a.status.replace(/_/g, " ")}</Badge></td>
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
