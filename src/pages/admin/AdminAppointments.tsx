import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, MapPin, Monitor, FileText, Printer, BookMarked, ChevronRight, Eye, Loader2, DollarSign, Plus, Video, ChevronLeft, Filter, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";

const PAGE_SIZE = 20;
const statuses = ["scheduled", "confirmed", "id_verification", "kba_pending", "in_session", "completed", "cancelled", "no_show"];

const statusFlow: Record<string, string> = {
  scheduled: "confirmed",
  confirmed: "id_verification",
  id_verification: "kba_pending",
  kba_pending: "in_session",
  in_session: "completed",
};

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

const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [receiptAppt, setReceiptAppt] = useState<any>(null);
  const [quickJournalAppt, setQuickJournalAppt] = useState<any>(null);
  const [detailAppt, setDetailAppt] = useState<any>(null);
  const [detailDocs, setDetailDocs] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingAppt, setCreatingAppt] = useState(false);
  // Message client state
  const [messageAppt, setMessageAppt] = useState<any>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newAppt, setNewAppt] = useState({
    client_id: "",
    service_type: "",
    notarization_type: "in_person" as "in_person" | "ron",
    scheduled_date: "",
    scheduled_time: "",
    location: "",
    notes: "",
    estimated_price: "",
  });
  const [journalForm, setJournalForm] = useState({
    fees_charged: "5.00",
    oath_administered: false,
    notes: "",
    platform_fees: "",
    travel_fee: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const openMessageDialog = (appt: any) => {
    const clientProfile = profiles.find((p) => p.user_id === appt.client_id);
    setMessageAppt(appt);
    setMessageSubject(`Regarding your ${appt.service_type} appointment on ${formatDate(appt.scheduled_date)}`);
    setMessageBody("");
  };

  const sendMessage = async () => {
    if (!messageAppt || !messageBody.trim()) return;
    const clientProfile = profiles.find((p) => p.user_id === messageAppt.client_id);
    if (!clientProfile?.email) {
      toast({ title: "No email", description: "This client has no email on file.", variant: "destructive" });
      return;
    }
    setSendingMessage(true);
    try {
      await supabase.functions.invoke("send-correspondence", {
        body: {
          to_address: clientProfile.email,
          subject: messageSubject,
          body: messageBody,
          client_id: messageAppt.client_id,
        },
      });
      toast({ title: "Message sent", description: `Email sent to ${clientProfile.email}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id,
        action: "client_messaged",
        entity_type: "appointment",
        entity_id: messageAppt.id,
        details: { to: clientProfile.email, subject: messageSubject },
      });
      setMessageAppt(null);
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
    setSendingMessage(false);
  };

  const getDateFilter = () => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    if (dateRange === "today") return { from: fmt(today), to: fmt(today) };
    if (dateRange === "week") {
      const end = new Date(today); end.setDate(end.getDate() + 7);
      return { from: fmt(today), to: fmt(end) };
    }
    if (dateRange === "month") {
      const end = new Date(today); end.setMonth(end.getMonth() + 1);
      return { from: fmt(today), to: fmt(end) };
    }
    return null;
  };

  const fetchData = async () => {
    let query = supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (filter !== "all") query = query.eq("status", filter as any);
    const df = getDateFilter();
    if (df) query = query.gte("scheduled_date", df.from).lte("scheduled_date", df.to);
    const [{ data: appts }, { data: profs }, { data: svcs }] = await Promise.all([
      query,
      supabase.from("profiles").select("*"),
      supabase.from("services").select("name").eq("is_active", true),
    ]);
    if (appts) { setAppointments(appts); setHasMore(appts.length === PAGE_SIZE); }
    if (profs) setProfiles(profs);
    if (svcs) setServices(svcs);
    setLoading(false);
  };

  useEffect(() => { setPage(0); }, [filter, dateRange]);
  useEffect(() => { fetchData(); }, [filter, dateRange, page]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const getClientName = (clientId: string) => {
    const p = profiles.find((p) => p.user_id === clientId);
    return p?.full_name || "Unknown Client";
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("appointments").update({ status: newStatus as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `→ ${newStatus.replace(/_/g, " ")}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id,
        action: "appointment_status_changed",
        entity_type: "appointment",
        entity_id: id,
        details: { new_status: newStatus },
      });

      // Send status change email notification
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-appointment-emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ appointment_id: id, status_change: newStatus }),
        });
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
      }

      if (newStatus === "completed") {
        const appt = appointments.find((a) => a.id === id);
        if (appt) {
          setQuickJournalAppt(appt);
          // Send review request email
          try {
            const clientProfile = profiles.find(p => p.user_id === appt.client_id);
            if (clientProfile?.email) {
              await supabase.from("client_correspondence").insert({
                client_id: appt.client_id,
                subject: "How was your notarization experience?",
                body: `Your ${appt.service_type} appointment has been completed. We'd love to hear your feedback! Please visit your Client Portal to leave a review.`,
                direction: "outbound",
                to_address: clientProfile.email,
                status: "sent",
              });
              await supabase.functions.invoke("send-correspondence", {
                body: {
                  to: clientProfile.email,
                  subject: "How was your notarization experience?",
                  body: `Your ${appt.service_type} appointment has been completed. We'd love to hear your feedback! Please visit your Client Portal to leave a review.`,
                },
              });
            }
          } catch (reviewEmailErr) {
            console.error("Review request email error:", reviewEmailErr);
          }
        }
      }
      fetchData();
    }
    setUpdatingId(null);
  };

  const advanceStatus = (appt: any) => {
    const next = statusFlow[appt.status];
    if (next) updateStatus(appt.id, next);
  };

  const openDetail = async (appt: any) => {
    setDetailAppt(appt);
    setEditNotes(appt.notes || "");
    setEditAdminNotes(appt.admin_notes || "");
    // Load linked documents
    const { data: docs } = await supabase.from("documents").select("*")
      .or(`appointment_id.eq.${appt.id},uploaded_by.eq.${appt.client_id}`)
      .order("created_at", { ascending: false });
    setDetailDocs(docs || []);
  };

  const saveNotes = async () => {
    if (!detailAppt) return;
    setSavingNotes(true);
    const { error } = await supabase.from("appointments").update({
      notes: editNotes || null,
      admin_notes: editAdminNotes || null,
    }).eq("id", detailAppt.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes saved" });
      setDetailAppt({ ...detailAppt, notes: editNotes, admin_notes: editAdminNotes });
      fetchData();
    }
    setSavingNotes(false);
  };

  const saveQuickJournal = async () => {
    if (!quickJournalAppt || !user) return;
    const feesCharged = parseFloat(journalForm.fees_charged) || 5;
    const platformFees = journalForm.platform_fees ? parseFloat(journalForm.platform_fees) : null;
    const travelFee = journalForm.travel_fee ? parseFloat(journalForm.travel_fee) : null;
    const netProfit = feesCharged - (platformFees || 0) - (travelFee || 0);

    const { error } = await supabase.from("notary_journal").insert({
      appointment_id: quickJournalAppt.id,
      signer_name: getClientName(quickJournalAppt.client_id),
      document_type: quickJournalAppt.service_type,
      service_performed: quickJournalAppt.service_type?.toLowerCase().includes("affidavit") ? "jurat" : "acknowledgment",
      notarization_type: quickJournalAppt.notarization_type,
      fees_charged: feesCharged,
      oath_administered: journalForm.oath_administered,
      oath_timestamp: journalForm.oath_administered ? new Date().toISOString() : null,
      notes: journalForm.notes || null,
      platform_fees: platformFees,
      travel_fee: travelFee,
      net_profit: netProfit,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Journal error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Journal entry saved" });
      // Auto-create payment record
      await supabase.from("payments").insert({
        client_id: quickJournalAppt.client_id,
        appointment_id: quickJournalAppt.id,
        amount: feesCharged,
        status: "pending",
        notes: `${quickJournalAppt.service_type} — ${quickJournalAppt.notarization_type === "ron" ? "RON" : "In-Person"}`,
      });
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "journal_entry_created",
        entity_type: "notary_journal",
        entity_id: quickJournalAppt.id,
        details: { fees_charged: feesCharged, net_profit: netProfit },
      });
      setQuickJournalAppt(null);
      setJournalForm({ fees_charged: "5.00", oath_administered: false, notes: "", platform_fees: "", travel_fee: "" });
    }
  };

  const createAppointment = async () => {
    if (!newAppt.client_id || !newAppt.service_type || !newAppt.scheduled_date || !newAppt.scheduled_time) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setCreatingAppt(true);
    const { error } = await supabase.from("appointments").insert({
      client_id: newAppt.client_id,
      service_type: newAppt.service_type,
      notarization_type: newAppt.notarization_type as any,
      scheduled_date: newAppt.scheduled_date,
      scheduled_time: newAppt.scheduled_time,
      location: newAppt.notarization_type === "ron" ? "Remote" : (newAppt.location || null),
      notes: newAppt.notes || null,
      estimated_price: newAppt.estimated_price ? parseFloat(newAppt.estimated_price) : null,
      status: "confirmed" as any,
    });
    if (error) {
      toast({ title: "Error creating appointment", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment created", description: "Walk-in/phone appointment added." });
      await supabase.from("audit_log").insert({
        user_id: user?.id,
        action: "appointment_created_by_admin",
        entity_type: "appointment",
        details: { client_id: newAppt.client_id, service_type: newAppt.service_type },
      });
      // Send email notification for admin-created appointment
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-appointment-emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ appointment_id: newAppt.client_id, emailType: "confirmation" }),
        });
      } catch {}
      setShowCreateDialog(false);
      setNewAppt({ client_id: "", service_type: "", notarization_type: "in_person", scheduled_date: "", scheduled_time: "", location: "", notes: "", estimated_price: "" });
      fetchData();
    }
    setCreatingAppt(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Appointments</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32"><Filter className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">No appointments found</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="border-border/50">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => openDetail(appt)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-accent" /> : <MapPin className="h-5 w-5 text-accent" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{appt.service_type}</p>
                    <p className="text-xs text-muted-foreground">{getClientName(appt.client_id)}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(appt.scheduled_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(appt.scheduled_time)}</span>
                    </div>
                    {appt.location && appt.location !== "Remote" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {appt.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => openDetail(appt)}>
                    <Eye className="mr-1 h-3 w-3" /> Details
                  </Button>
                  {statusFlow[appt.status] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => advanceStatus(appt)}
                      disabled={updatingId === appt.id}
                    >
                      {updatingId === appt.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                      {statusFlow[appt.status].replace(/_/g, " ")}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.stopPropagation(); openMessageDialog(appt); }}>
                    <Mail className="mr-1 h-3 w-3" /> Message
                  </Button>
                  {appt.notarization_type === "ron" && ["kba_pending", "in_session"].includes(appt.status) && (
                    <Link to={`/ron-session?id=${appt.id}`}>
                      <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700 text-xs">
                        <Video className="mr-1 h-3 w-3" /> Launch Session
                      </Button>
                    </Link>
                  )}
                  {appt.status === "completed" && (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setReceiptAppt(appt)}>
                      <Printer className="mr-1 h-3 w-3" /> Receipt
                    </Button>
                  )}
                  <Select value={appt.status} onValueChange={(v) => updateStatus(appt.id, v)}>
                    <SelectTrigger className="w-40">
                      <Badge className={statusColors[appt.status] || "bg-muted"}>{appt.status.replace(/_/g, " ")}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="mr-1 h-3 w-3" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" /> Create Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client *</Label>
              <Select value={newAppt.client_id} onValueChange={(v) => setNewAppt({ ...newAppt, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service Type *</Label>
              <Select value={newAppt.service_type} onValueChange={(v) => setNewAppt({ ...newAppt, service_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select service..." /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notarization Type</Label>
              <Select value={newAppt.notarization_type} onValueChange={(v) => setNewAppt({ ...newAppt, notarization_type: v as "in_person" | "ron" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="ron">Remote Online (RON)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={newAppt.scheduled_date} onChange={(e) => setNewAppt({ ...newAppt, scheduled_date: e.target.value })} />
              </div>
              <div>
                <Label>Time *</Label>
                <Input type="time" value={newAppt.scheduled_time} onChange={(e) => setNewAppt({ ...newAppt, scheduled_time: e.target.value })} />
              </div>
            </div>
            {newAppt.notarization_type === "in_person" && (
              <div>
                <Label>Location</Label>
                <Input value={newAppt.location} onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })} placeholder="Address or meeting place..." />
              </div>
            )}
            <div>
              <Label>Estimated Price ($)</Label>
              <Input type="number" step="0.01" value={newAppt.estimated_price} onChange={(e) => setNewAppt({ ...newAppt, estimated_price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} rows={2} placeholder="Walk-in, phone call, referral..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createAppointment} disabled={creatingAppt} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              {creatingAppt ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!detailAppt} onOpenChange={() => setDetailAppt(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Appointment Details</DialogTitle>
          </DialogHeader>
          {detailAppt && (() => {
            const clientProfile = profiles.find((p) => p.user_id === detailAppt.client_id);
            return (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{getClientName(detailAppt.client_id)}</span></div>
                {clientProfile?.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{clientProfile.email}</span></div>}
                {clientProfile?.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{clientProfile.phone}</span></div>}
                {clientProfile?.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[60%]">{[clientProfile.address, clientProfile.city, clientProfile.state, clientProfile.zip].filter(Boolean).join(", ")}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{detailAppt.service_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{detailAppt.notarization_type === "ron" ? "RON" : "In-Person"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDate(detailAppt.scheduled_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{formatTime(detailAppt.scheduled_time)}</span></div>
                {detailAppt.location && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium text-right max-w-[60%]">{detailAppt.location}</span></div>}
                {detailAppt.estimated_price && <div className="flex justify-between"><span className="text-muted-foreground">Est. Price</span><span className="font-medium">${parseFloat(detailAppt.estimated_price).toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[detailAppt.status]}>{detailAppt.status.replace(/_/g, " ")}</Badge></div>
              </div>

              {/* Mark as Paid */}
              {detailAppt.status === "completed" && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1"><DollarSign className="h-3 w-3" /> Payment</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={async (method) => {
                      const { error } = await supabase.from("payments").update({
                        status: "paid", method, paid_at: new Date().toISOString(),
                      }).eq("appointment_id", detailAppt.id).eq("status", "pending");
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Payment marked as paid", description: `Method: ${method}` });
                        await supabase.from("audit_log").insert({
                          user_id: user?.id, action: "payment_marked_paid",
                          entity_type: "payment", details: { appointment_id: detailAppt.id, method },
                        });
                      }
                    }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Mark as Paid..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Linked Documents */}
              {detailDocs.length > 0 && (
                <div>
                  <Label className="mb-2 block">Documents ({detailDocs.length})</Label>
                  <div className="space-y-1">
                    {detailDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-xs">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-accent" />
                          {doc.file_name}
                        </span>
                        <Badge className={statusColors[doc.status] || "bg-muted"}>{doc.status.replace(/_/g, " ")}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Client Notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Client-visible notes..." />
              </div>
              <div>
                <Label>Admin Notes (internal)</Label>
                <Textarea value={editAdminNotes} onChange={(e) => setEditAdminNotes(e.target.value)} rows={3} placeholder="Internal notes, session observations..." />
              </div>
              <Button onClick={saveNotes} disabled={savingNotes} className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">
                {savingNotes ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save Notes
              </Button>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Quick Journal Entry Dialog */}
      <Dialog open={!!quickJournalAppt} onOpenChange={() => setQuickJournalAppt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-accent" />
              Quick Journal Entry
            </DialogTitle>
          </DialogHeader>
          {quickJournalAppt && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>Client:</strong> {getClientName(quickJournalAppt.client_id)}</p>
                <p><strong>Service:</strong> {quickJournalAppt.service_type}</p>
                <p><strong>Date:</strong> {formatDate(quickJournalAppt.scheduled_date)}</p>
                <p><strong>Type:</strong> {quickJournalAppt.notarization_type === "ron" ? "RON" : "In-Person"}</p>
              </div>
              <div>
                <Label>Fee Charged ($)</Label>
                <Input type="number" step="0.01" value={journalForm.fees_charged} onChange={(e) => setJournalForm({ ...journalForm, fees_charged: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Platform Fees ($)</Label>
                  <Input type="number" step="0.01" value={journalForm.platform_fees} onChange={(e) => setJournalForm({ ...journalForm, platform_fees: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>Travel Fee ($)</Label>
                  <Input type="number" step="0.01" value={journalForm.travel_fee} onChange={(e) => setJournalForm({ ...journalForm, travel_fee: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={journalForm.oath_administered} onCheckedChange={(v) => setJournalForm({ ...journalForm, oath_administered: v })} />
                <Label>Oath/Affirmation Administered</Label>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={journalForm.notes} onChange={(e) => setJournalForm({ ...journalForm, notes: e.target.value })} rows={2} placeholder="Any session notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickJournalAppt(null)}>Skip</Button>
            <Button onClick={saveQuickJournal} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              Save Journal Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptAppt} onOpenChange={() => setReceiptAppt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Notarization Receipt</DialogTitle>
          </DialogHeader>
          {receiptAppt && (
            <div className="space-y-4" id="receipt-content" data-print-receipt>
              <div className="text-center border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold text-foreground">Shane Goble</h2>
                <p className="text-sm text-muted-foreground">Ohio Commissioned Notary Public</p>
                <p className="text-xs text-muted-foreground">Franklin County, Ohio</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receipt of Notarial Act</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date of Service</span><span className="font-medium">{formatDate(receiptAppt.scheduled_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{formatTime(receiptAppt.scheduled_time)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{getClientName(receiptAppt.client_id)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{receiptAppt.service_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Notarization Type</span><span className="font-medium">{receiptAppt.notarization_type === "ron" ? "Remote Online (RON)" : "In-Person"}</span></div>
                {receiptAppt.location && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{receiptAppt.location}</span></div>}
                {receiptAppt.estimated_price && (
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Estimated Fee</span>
                    <span className="font-bold">${parseFloat(receiptAppt.estimated_price).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Fee (per ORC §147.08)</span>
                  <span className="font-bold">$5.00 per signature</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center space-y-1">
                <p>This notarization was performed in compliance with Ohio Revised Code Chapter 147.</p>
                {receiptAppt.notarization_type === "ron" && (
                  <p>RON session conducted per ORC §147.65-.66. Session recording stored per requirements.</p>
                )}
                <p className="mt-2">Thank you for choosing Shane Goble Notary Services.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptAppt(null)}>Close</Button>
            <Button onClick={() => window.print()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              <Printer className="mr-1 h-4 w-4" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
