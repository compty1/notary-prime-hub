import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, Users, Package, MapPin } from "lucide-react";

const COLORS = ["hsl(224, 63%, 28%)", "hsl(168, 75%, 36%)", "hsl(42, 78%, 55%)", "hsl(0, 85%, 55%)", "hsl(261, 50%, 51%)", "hsl(190, 95%, 39%)"];

interface PaymentRow { amount: number | null; status: string; created_at: string; method: string | null; }
interface AppointmentRow { scheduled_date: string; status: string; service_type: string; notarization_type: string; travel_distance_miles: number | null; client_id?: string; }
interface OrderRow { total: number | null; status: string; priority: string | null; service_category: string | null; created_at: string; }
interface ProfileRow { user_id: string; created_at: string; }

export default function AdminAnalytics() {
  usePageMeta({ title: "Analytics", noIndex: true });
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("6m");

  useEffect(() => {
    (async () => {
      const cutoff = new Date();
      const months = dateRange === "1m" ? 1 : dateRange === "3m" ? 3 : dateRange === "1y" ? 12 : 6;
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toISOString();

      const [paymentsRes, apptsRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from("payments").select("amount, status, created_at, method").gte("created_at", cutoffStr),
        supabase.from("appointments").select("scheduled_date, status, service_type, notarization_type, travel_distance_miles").gte("scheduled_date", cutoff.toISOString().split("T")[0]),
        supabase.from("orders").select("total, status, priority, service_category, created_at").gte("created_at", cutoffStr),
        supabase.from("profiles").select("user_id, created_at"),
      ]);
      setPayments(paymentsRes.data || []);
      setAppointments(apptsRes.data || []);
      setOrders(ordersRes.data || []);
      setProfiles(profilesRes.data || []);
      setLoading(false);
    })();
  }, [dateRange]);

  const totalRevenue = useMemo(() => payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0), [payments]);
  const totalOrders = orders.length;
  const activeClients = new Set(appointments.map(a => a.client_id)).size || profiles.length;

  const revenueByMonth = useMemo(() => {
    const m: Record<string, number> = {};
    payments.filter(p => p.status === "paid").forEach(p => {
      const month = p.created_at?.slice(0, 7);
      if (month) m[month] = (m[month] || 0) + (p.amount || 0);
    });
    return Object.entries(m).sort().map(([month, revenue]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue,
    }));
  }, [payments]);

  const serviceBreakdown = useMemo(() => {
    const s: Record<string, number> = {};
    appointments.forEach(a => { s[a.service_type || "Other"] = (s[a.service_type || "Other"] || 0) + 1; });
    return Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const statusBreakdown = useMemo(() => {
    const s: Record<string, number> = {};
    orders.forEach(o => { s[o.status] = (s[o.status] || 0) + 1; });
    return Object.entries(s).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [orders]);

  const newClientsPerMonth = useMemo(() => {
    const m: Record<string, number> = {};
    profiles.forEach(p => {
      const month = p.created_at?.slice(0, 7);
      if (month) m[month] = (m[month] || 0) + 1;
    });
    return Object.entries(m).sort().slice(-6).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      clients: count,
    }));
  }, [profiles]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Revenue, service, and client insights</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardContent className="pt-6 flex items-center gap-4">
          <DollarSign className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4">
          <Package className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{totalOrders}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4">
          <Users className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Active Clients</p><p className="text-2xl font-bold">{activeClients}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="revenue" className="text-xs gap-1"><DollarSign className="h-3 w-3" /> Revenue</TabsTrigger>
          <TabsTrigger value="services" className="text-xs gap-1"><Package className="h-3 w-3" /> Services</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs gap-1"><Users className="h-3 w-3" /> Clients</TabsTrigger>
          <TabsTrigger value="geographic" className="text-xs gap-1"><MapPin className="h-3 w-3" /> Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue Over Time</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByMonth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} /><Line type="monotone" dataKey="revenue" stroke="hsl(224, 63%, 28%)" strokeWidth={2} /></LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Order Status Distribution</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader><CardTitle className="text-sm">Orders by Service Type</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(224, 63%, 28%)" radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">New Clients Per Month</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={newClientsPerMonth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="clients" fill="hsl(168, 75%, 36%)" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Client Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Registered</span><span className="font-bold">{profiles.length}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Avg Revenue/Client</span><span className="font-bold">${profiles.length > 0 ? (totalRevenue / profiles.length).toFixed(2) : "0.00"}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic">
          <Card>
            <CardHeader><CardTitle className="text-sm">Travel Distance Summary</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const withTravel = appointments.filter(a => a.travel_distance_miles && a.travel_distance_miles > 0);
                const avgMiles = withTravel.length > 0 ? (withTravel.reduce((s, a) => s + a.travel_distance_miles, 0) / withTravel.length).toFixed(1) : "0";
                return (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><p className="text-xs text-muted-foreground">Appointments with Travel</p><p className="text-2xl font-bold">{withTravel.length}</p></div>
                    <div><p className="text-xs text-muted-foreground">Average Distance</p><p className="text-2xl font-bold">{avgMiles} mi</p></div>
                    <div><p className="text-xs text-muted-foreground">In-Person vs RON</p>
                      <p className="text-sm">{appointments.filter(a => a.notarization_type === "in_person").length} in-person / {appointments.filter(a => a.notarization_type === "ron").length} RON</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
