import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Phone, Calendar, Star, MapPin, Monitor, Mail, Download, Save, Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const PAGE_SIZE = 30;

export default function AdminClients() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [page, setPage] = useState(0);
  // Message state
  const [messageClient, setMessageClient] = useState<any>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const sendClientMessage = async () => {
    if (!messageClient?.email || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      await supabase.functions.invoke("send-correspondence", {
        body: { to_address: messageClient.email, subject: messageSubject, body: messageBody, client_id: messageClient.user_id },
      });
      toast({ title: "Message sent", description: `Email sent to ${messageClient.email}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id, action: "client_messaged", entity_type: "profile",
        entity_id: messageClient.user_id, details: { to: messageClient.email, subject: messageSubject },
      });
      setMessageClient(null);
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
    setSendingMessage(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, apptRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }),
      ]);
      if (profileRes.data) setProfiles(profileRes.data);
      if (apptRes.data) setAppointments(apptRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getClientStats = (userId: string) => {
    const clientAppts = appointments.filter((a) => a.client_id === userId);
    const completed = clientAppts.filter((a) => a.status === "completed").length;
    const total = clientAppts.length;
    const lastVisit = clientAppts.find((a) => a.status === "completed")?.scheduled_date;
    return { total, completed, lastVisit, isRepeat: completed >= 2, appointments: clientAppts };
  };

  const filtered = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openClient = (p: any) => {
    setSelectedClient(p);
    setAdminNotes(p.admin_notes || "");
  };

  const saveAdminNotes = async () => {
    if (!selectedClient || !user) return;
    setSavingNotes(true);
    const { error } = await supabase.from("profiles").update({ admin_notes: adminNotes || null } as any).eq("user_id", selectedClient.user_id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Notes saved" });
      setProfiles((prev) => prev.map((p) => p.user_id === selectedClient.user_id ? { ...p, admin_notes: adminNotes } : p));
      setSelectedClient({ ...selectedClient, admin_notes: adminNotes });
      // Audit log for profile update
      await supabase.from("audit_log").insert({
        user_id: user.id, action: "client_profile_updated", entity_type: "profile",
        entity_id: selectedClient.user_id, details: { updated_field: "admin_notes" },
      });
    }
    setSavingNotes(false);
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Address", "City", "State", "Zip", "Total Appts", "Completed", "Member Since"];
    const rows = filtered.map((p) => {
      const stats = getClientStats(p.user_id);
      return [p.full_name || "", p.email || "", p.phone || "", p.address || "", p.city || "", p.state || "", p.zip || "", stats.total, stats.completed, new Date(p.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clients.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Client Directory</h1>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="mr-1 h-3 w-3" /> Export CSV
        </Button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, phone, or address..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      ) : paginated.length === 0 ? (
        <Card className="border-border/50"><CardContent className="flex flex-col items-center py-12 text-center"><Users className="mb-4 h-12 w-12 text-muted-foreground/50" /><p className="text-muted-foreground">No clients found</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((p) => {
            const stats = getClientStats(p.user_id);
            return (
              <Card key={p.id} className="cursor-pointer border-border/50 transition-shadow hover:shadow-md" onClick={() => openClient(p)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {(p.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                        {stats.isRepeat && <Badge className="bg-accent/20 text-accent-foreground text-xs flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> Repeat</Badge>}
                      </div>
                      {p.email && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {p.email}</p>}
                      {p.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {p.phone}</p>}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{stats.total} appt{stats.total !== 1 ? "s" : ""}</span>
                        {stats.lastVisit && <span>• Last: {formatDate(stats.lastVisit)}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{selectedClient?.full_name || "Client Details"}</DialogTitle></DialogHeader>
          {selectedClient && (() => {
            const stats = getClientStats(selectedClient.user_id);
            return (
              <div className="space-y-4">
                <div className="grid gap-2 text-sm">
                  {selectedClient.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {selectedClient.email}</p>}
                  {selectedClient.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {selectedClient.phone}</p>}
                  {selectedClient.address && (
                    <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {selectedClient.address}{selectedClient.city ? `, ${selectedClient.city}` : ""}{selectedClient.state ? `, ${selectedClient.state}` : ""} {selectedClient.zip || ""}</p>
                  )}
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> Member since {new Date(selectedClient.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xl font-bold text-emerald-600">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xs font-bold text-foreground">{stats.lastVisit ? formatDate(stats.lastVisit) : "—"}</p><p className="text-xs text-muted-foreground">Last Visit</p></div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Admin Notes (internal)</Label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Preferences, history, special instructions..." className="mt-1" />
                  <Button size="sm" onClick={saveAdminNotes} disabled={savingNotes} className="mt-2 bg-accent text-accent-foreground hover:bg-gold-dark">
                    {savingNotes ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save Notes
                  </Button>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Appointment History</h4>
                  {stats.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No appointments</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {stats.appointments.map((appt: any) => (
                        <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            {appt.notarization_type === "ron" ? <Monitor className="h-3 w-3 text-accent" /> : <MapPin className="h-3 w-3 text-accent" />}
                            <div><p className="text-xs font-medium">{appt.service_type}</p><p className="text-xs text-muted-foreground">{formatDate(appt.scheduled_date)}</p></div>
                          </div>
                          <Badge className={`text-xs ${statusColors[appt.status] || "bg-muted"}`}>{appt.status?.replace(/_/g, " ")}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
