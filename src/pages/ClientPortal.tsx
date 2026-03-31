import React, { useEffect, useState, useRef } from "react";
import { INTAKE_ONLY_SERVICES, SAAS_LINKS, SUBSCRIPTION_SERVICES as SUBSCRIPTION_SVC_SET, PORTAL_SERVICES as PORTAL_SVC_SET } from "@/lib/serviceConstants";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, LogOut, Shield, FileText, CheckCircle, User, Pencil, Save, Loader2, Upload, FolderOpen, QrCode, ArrowRight, MessageSquare, Send, Sparkles, Eye, DollarSign, Star, ShoppingBag, Mail, Package, CreditCard, Bell, XCircle, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import DocumentWizard from "@/components/DocumentWizard";
import PaymentForm from "@/components/PaymentForm";
import TechCheck from "@/components/TechCheck";
import { Logo } from "@/components/Logo";
import { formatPhone } from "@/lib/formatPhone";
import PortalAppointmentsTab from "./portal/PortalAppointmentsTab";
import PortalDocumentsTab from "./portal/PortalDocumentsTab";
import PortalChatTab from "./portal/PortalChatTab";
import { PortalLoadingSkeleton } from "@/components/PortalLoadingSkeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageTitle } from "@/lib/usePageTitle";
const pipelineSteps = [
  { key: "uploaded", label: "Intake", icon: Upload },
  { key: "pending_review", label: "Review", icon: FileText },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "notarized", label: "Notarized", icon: Shield },
];

export default function ClientPortal() {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || window.location.hash?.slice(1) || "overview";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  usePageTitle("Client Portal");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [techCheckOpen, setTechCheckOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", address: "", city: "", state: "", zip: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ appointment_id: "", rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatRecipient, setChatRecipient] = useState("");
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: string; role: string }[]>([]);

  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainDialogOpen, setExplainDialogOpen] = useState(false);

  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [apostilleRequests, setApostilleRequests] = useState<any[]>([]);
  const [apostilleForm, setApostilleForm] = useState({ document_description: "", notes: "", destination_country: "", document_count: "1" });
  const [submittingApostille, setSubmittingApostille] = useState(false);
  const [payingPaymentId, setPayingPaymentId] = useState<string | null>(null);
  const [zoomLink, setZoomLink] = useState("");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderForm, setReminderForm] = useState({ document_id: "", expiry_date: "", remind_days_before: "30" });
  const [savingReminder, setSavingReminder] = useState(false);

  // Shared constants from single source of truth
  const { INTAKE_ONLY_SERVICES: INTAKE_ONLY, SAAS_LINKS: SAAS_TOOLS, SUBSCRIPTION_SERVICES, PORTAL_SERVICES } = await import("@/lib/serviceConstants").then(m => m).catch(() => ({
    INTAKE_ONLY_SERVICES: new Set<string>(), SAAS_LINKS: {} as Record<string, string>,
    SUBSCRIPTION_SERVICES: new Set<string>(), PORTAL_SERVICES: new Set<string>(),
  }));

  const getServiceUrl = (svc: any) => {
    if (SAAS_TOOLS[svc.name]) return SAAS_TOOLS[svc.name];
    if (INTAKE_ONLY.has(svc.name)) return `/request?service=${encodeURIComponent(svc.name)}`;
    if (SUBSCRIPTION_SERVICES.has(svc.name)) return "/subscribe";
    if (PORTAL_SERVICES.has(svc.name)) return "/portal";
    return `/book?type=${svc.name.toLowerCase().includes("remote") ? "ron" : "in_person"}&service=${encodeURIComponent(svc.name)}`;
  };
  const getServiceCTA = (svc: any) => {
    if (SAAS_TOOLS[svc.name]) return "Use Tool";
    if (INTAKE_ONLY.has(svc.name)) return "Get Started";
    if (SUBSCRIPTION_SERVICES.has(svc.name)) return "View Plans";
    if (PORTAL_SERVICES.has(svc.name)) return "Open Portal";
    return "Book Now";
  };

  const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [apptRes, profileRes, docsRes, payRes, revRes, svcRes, corrRes, apoRes, reqRes, remRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("documents").select("*").eq("uploaded_by", user.id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("services").select("*").eq("is_active", true).order("display_order"),
        supabase.from("client_correspondence").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("apostille_requests").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("service_requests").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("document_reminders").select("*").eq("user_id", user.id).order("expiry_date"),
      ]);
      if (apptRes.data) setAppointments(apptRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (revRes.data) setReviews(revRes.data);
      if (svcRes.data) setServices(svcRes.data);
      if (corrRes.data) setCorrespondence(corrRes.data);
      if (apoRes.data) setApostilleRequests(apoRes.data);
      if (reqRes.data) setServiceRequests(reqRes.data);
      if (remRes.data) setReminders(remRes.data);
      const { data: zoomSetting } = await supabase.from("platform_settings").select("setting_value").eq("setting_key", "zoom_meeting_link").single();
      if (zoomSetting?.setting_value) setZoomLink(zoomSetting.setting_value);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({ full_name: profileRes.data.full_name || "", phone: profileRes.data.phone || "", address: profileRes.data.address || "", city: profileRes.data.city || "", state: profileRes.data.state || "", zip: profileRes.data.zip || "" });
      }
      setLoading(false);
      setInitialLoad(false);
    };
    fetchData();

    supabase.from("chat_messages").select("*").or(`sender_id.eq.${user.id},and(is_admin.eq.true,recipient_id.eq.${user.id})`).order("created_at").then(({ data }) => {
      if (data) { setChatMessages(data); setUnreadCount(data.filter((m: any) => m.is_admin && !m.read).length); }
    });

    const chatChannel = supabase.channel("client-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
      const msg = payload.new as any;
      if (msg.sender_id === user.id || (msg.is_admin && msg.recipient_id === user.id)) setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    }).subscribe();

    const apptChannel = supabase.channel("client-appointments").on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, (payload) => {
      const updated = payload.new as any;
      if (updated.client_id === user.id) { setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a)); toast({ title: "Appointment updated", description: `Status: ${updated.status.replace(/_/g, " ")}` }); }
    }).subscribe();

    const paymentChannel = supabase.channel("client-payments").on("postgres_changes", { event: "*", schema: "public", table: "payments" }, (payload) => {
      const record = (payload.new || payload.old) as any;
      if (record?.client_id === user.id) {
        if (payload.eventType === "INSERT") { setPayments(prev => [payload.new as any, ...prev]); toast({ title: "New payment request", description: `Amount: $${(payload.new as any).amount}` }); }
        else if (payload.eventType === "UPDATE") setPayments(prev => prev.map(p => p.id === record.id ? payload.new as any : p));
      }
    }).subscribe();

    const docChannel = supabase.channel("client-documents").on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `uploaded_by=eq.${user.id}` }, (payload) => {
      if (payload.eventType === "INSERT") { setDocuments(prev => prev.some(d => d.id === (payload.new as any).id) ? prev : [payload.new as any, ...prev]); toast({ title: "Document uploaded", description: (payload.new as any).file_name }); }
      else if (payload.eventType === "UPDATE") setDocuments(prev => prev.map(d => d.id === (payload.new as any).id ? payload.new as any : d));
      else if (payload.eventType === "DELETE") setDocuments(prev => prev.filter(d => d.id !== (payload.old as any).id));
    }).subscribe();

    return () => { supabase.removeChannel(chatChannel); supabase.removeChannel(apptChannel); supabase.removeChannel(paymentChannel); supabase.removeChannel(docChannel); };
  }, [user]);

  const upcoming = appointments.filter(a => ["scheduled", "confirmed", "id_verification", "kba_pending"].includes(a.status));
  const past = appointments.filter(a => ["completed", "cancelled", "no_show"].includes(a.status));

  const cancelAppointment = async (id: string) => {
    // Check if appointment is cancellable
    const appt = appointments.find(a => a.id === id);
    if (appt && ["in_session", "completed", "cancelled"].includes(appt.status)) {
      toast({ title: "Cannot cancel", description: `This appointment is already ${appt.status.replace(/_/g, " ")}.`, variant: "destructive" });
      setCancelDialogId(null);
      return;
    }
    setCancelling(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelled" as any }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Appointment cancelled" }); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a)); try { await supabase.functions.invoke("send-appointment-emails", { body: { appointmentId: id, emailType: "cancellation" } }); } catch {} }
    setCancelling(false); setCancelDialogId(null);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: profileForm.full_name, phone: profileForm.phone || null, address: profileForm.address || null, city: profileForm.city || null, state: profileForm.state || null, zip: profileForm.zip || null }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile updated" }); setProfile({ ...profile, ...profileForm }); setEditProfileOpen(false); }
    setSavingProfile(false);
  };

  useEffect(() => {
    const loadStaff = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "notary"]);
      if (!roles || roles.length === 0) return;
      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const staff = userIds.map(uid => ({ id: uid, name: profiles?.find(p => p.user_id === uid)?.full_name || "", role: roles.find(r => r.user_id === uid)?.role || "admin" }));
      setStaffUsers(staff);
      if (staff.length > 0 && !chatRecipient) setChatRecipient(staff[0].id);
    };
    if (user) loadStaff();
  }, [user]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !user) return;
    setSendingChat(true);
    const { error } = await supabase.from("chat_messages").insert({ sender_id: user.id, message: chatInput.trim(), is_admin: false, recipient_id: chatRecipient || null });
    if (error) toast({ title: "Error sending message", variant: "destructive" });
    else setChatInput("");
    setSendingChat(false);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const explainDocument = async (doc: any) => {
    setExplaining(true); setExplanation(null); setExplainDialogOpen(true);
    try {
      const { data: fileData, error } = await supabase.storage.from("documents").download(doc.file_path);
      if (error) throw error;
      const text = await fileData.text();
      // Limit text to 50k chars to avoid sending huge payloads
      const truncatedText = text.slice(0, 50000);
      const { data: result, error: fnError } = await supabase.functions.invoke("explain-document", {
        body: { documentText: truncatedText, fileName: doc.file_name },
      });
      if (fnError) throw fnError;
      if (result.error) throw new Error(result.error);
      setExplanation(result.explanation + "\n\n" + result.disclaimer);
    } catch (e: any) { setExplanation("Could not analyze this document. " + (e.message || "")); }
    setExplaining(false);
  };

  const getDocPipelineProgress = (status: string) => {
    const idx = pipelineSteps.findIndex(s => s.key === status);
    return idx >= 0 ? ((idx + 1) / pipelineSteps.length) * 100 : 0;
  };

  const qrUrl = `${window.location.origin}/mobile-upload`;
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-muted/30">
        <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link to="/" className="flex items-center gap-2"><Logo size="md" /><span className="font-sans text-lg font-bold text-foreground">Client Portal</span></Link>
            <Button variant="ghost" size="sm" onClick={() => setLogoutDialogOpen(true)}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </nav>
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <PortalLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2"><Logo size="md" /><span className="font-sans text-lg font-bold text-foreground">Client Portal</span></Link>
          <div className="flex items-center gap-3">
            {isAdmin && <Link to="/admin"><Button variant="outline" size="sm">Admin Dashboard</Button></Link>}
            <Button variant="ghost" size="sm" onClick={() => setLogoutDialogOpen(true)}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between mt-4">
          <div>
            <h1 className="font-sans text-3xl font-bold text-foreground">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
            <p className="text-muted-foreground">Manage your documents, appointments, and notarization status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)}><QrCode className="mr-1 h-3 w-3" /> Mobile Upload</Button>
            <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}><Pencil className="mr-1 h-3 w-3" /> Edit Profile</Button>
          </div>
        </motion.div>

        <Tabs defaultValue={initialTab} className="space-y-6" onValueChange={val => {
          // Deep link support
          window.history.replaceState(null, "", `/portal#${val}`);
          if (val === "chat" && user && unreadCount > 0) {
            const unreadIds = chatMessages.filter(m => m.is_admin && !m.read).map(m => m.id);
            if (unreadIds.length > 0) supabase.from("chat_messages").update({ read: true }).in("id", unreadIds).then(() => { setChatMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m)); setUnreadCount(0); });
          }
        }}>
          <TabsList className="w-full overflow-x-auto flex flex-nowrap gap-1 h-auto justify-start sm:justify-center scrollbar-hide">
            <TabsTrigger value="overview" aria-label="Dashboard Overview"><Home className="mr-1 h-4 w-4 hidden sm:inline" /> Home</TabsTrigger>
            <TabsTrigger value="appointments" aria-label="Appointments"><Calendar className="mr-1 h-4 w-4 hidden sm:inline" /> Appts</TabsTrigger>
            <TabsTrigger value="documents" aria-label="Documents"><FileText className="mr-1 h-4 w-4 hidden sm:inline" /> Docs</TabsTrigger>
            <TabsTrigger value="status" aria-label="Document Status"><Shield className="mr-1 h-4 w-4 hidden sm:inline" /> Status</TabsTrigger>
            <TabsTrigger value="chat" className="relative" aria-label="Live Chat"><MessageSquare className="mr-1 h-4 w-4 hidden sm:inline" /> Chat{unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unreadCount}</span>}</TabsTrigger>
            <TabsTrigger value="correspondence" aria-label="Email Correspondence"><Mail className="mr-1 h-4 w-4 hidden sm:inline" /> Mail</TabsTrigger>
            <TabsTrigger value="payments" aria-label="Payments"><DollarSign className="mr-1 h-4 w-4 hidden sm:inline" /> Pay</TabsTrigger>
            <TabsTrigger value="apostille" aria-label="Apostille Requests"><Package className="mr-1 h-4 w-4 hidden sm:inline" /> Apost.</TabsTrigger>
            <TabsTrigger value="requests" aria-label="Service Requests"><Clock className="mr-1 h-4 w-4 hidden sm:inline" /> Requests</TabsTrigger>
            <TabsTrigger value="reminders" aria-label="Document Reminders"><Bell className="mr-1 h-4 w-4 hidden sm:inline" /> Remind</TabsTrigger>
            <TabsTrigger value="reviews" aria-label="Reviews"><Star className="mr-1 h-4 w-4 hidden sm:inline" /> Reviews</TabsTrigger>
            <TabsTrigger value="services" aria-label="Available Services"><ShoppingBag className="mr-1 h-4 w-4 hidden sm:inline" /> Services</TabsTrigger>
          </TabsList>

          {/* DASHBOARD OVERVIEW TAB — Item 171 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-2xl font-bold">{upcoming.length}</p><p className="text-xs text-muted-foreground">Upcoming Appts</p></div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2"><FileText className="h-5 w-5 text-accent-foreground" /></div>
                  <div><p className="text-2xl font-bold">{documents.length}</p><p className="text-xs text-muted-foreground">Documents</p></div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-2xl font-bold">${payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Paid</p></div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2"><Bell className="h-5 w-5 text-destructive" /></div>
                  <div><p className="text-2xl font-bold">{payments.filter(p => p.status === "pending").length + unreadCount}</p><p className="text-xs text-muted-foreground">Action Needed</p></div>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Link to="/book"><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Book Appointment</Button></Link>
              <Button size="sm" variant="outline" onClick={() => setShowWizard(true)}><Sparkles className="mr-1 h-4 w-4" /> AI Document Wizard</Button>
              <Button size="sm" variant="outline" onClick={() => setQrDialogOpen(true)}><QrCode className="mr-1 h-4 w-4" /> Mobile Upload</Button>
            </div>

            {/* Upcoming appointments preview */}
            {upcoming.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Next Appointments</h3>
                <div className="space-y-2">
                  {upcoming.slice(0, 3).map(a => (
                    <Card key={a.id} className="border-border/50">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{a.service_type}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(a.scheduled_date)} at {a.scheduled_time} ET</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{a.status.replace(/_/g, " ")}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pending payments */}
            {payments.filter(p => p.status === "pending").length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Pending Payments</h3>
                <div className="space-y-2">
                  {payments.filter(p => p.status === "pending").slice(0, 3).map(p => (
                    <Card key={p.id} className="border-border/50 border-l-4 border-l-destructive">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">${Number(p.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{p.notes || "Payment due"}</p>
                        </div>
                        <Button size="sm" variant="default" onClick={() => { setPayingPaymentId(p.id); setShowPaymentForm(true); }}>
                          <CreditCard className="mr-1 h-3 w-3" /> Pay Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            <PortalAppointmentsTab appointments={appointments} loading={loading} zoomLink={zoomLink} onCancelClick={setCancelDialogId} onTechCheck={() => setTechCheckOpen(true)} />
          </TabsContent>

          <TabsContent value="documents">
            {user && <PortalDocumentsTab userId={user.id} documents={documents} setDocuments={setDocuments} upcomingAppointments={upcoming} onExplainDocument={explainDocument} />}
          </TabsContent>

          {/* STATUS TAB */}
          <TabsContent value="status" className="space-y-6">
            <h2 className="font-sans text-xl font-semibold">Document Pipeline</h2>
            {documents.length === 0 ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><p>No documents to track</p></CardContent></Card>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <Card key={doc.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium truncate">{doc.file_name}</span><Badge variant="outline" className="text-xs">{doc.status.replace(/_/g, " ")}</Badge></div>
                      <Progress value={getDocPipelineProgress(doc.status)} className="h-2" />
                      <div className="flex justify-between mt-2">
                        {pipelineSteps.map((ps, i) => {
                          const isComplete = pipelineSteps.findIndex(s => s.key === doc.status) >= i;
                          return <div key={ps.key} className="flex flex-col items-center gap-1"><ps.icon className={`h-3 w-3 ${isComplete ? "text-primary" : "text-muted-foreground/40"}`} /><span className={`text-[9px] ${isComplete ? "text-foreground" : "text-muted-foreground/40"}`}>{ps.label}</span></div>;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            {user && <PortalChatTab userId={user.id} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendingChat={sendingChat} chatRecipient={chatRecipient} setChatRecipient={setChatRecipient} staffUsers={staffUsers} onSend={sendChatMessage} chatEndRef={chatEndRef as React.RefObject<HTMLDivElement>} />}
          </TabsContent>

          {/* CORRESPONDENCE TAB */}
          <TabsContent value="correspondence" className="space-y-6">
            <h2 className="font-sans text-xl font-semibold">Email Correspondence</h2>
            {correspondence.length === 0 ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><p>No correspondence yet</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {correspondence.map(c => (
                  <Card key={c.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">{c.direction === "inbound" ? <Mail className="h-4 w-4 text-primary" /> : <Send className="h-4 w-4 text-primary" />}<span className="text-sm font-medium">{c.subject}</span></div>
                        <Badge className={c.status === "replied" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : c.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}>{c.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{c.direction === "inbound" ? `From: ${c.from_address || "—"}` : `To: ${c.to_address || "—"}`}</p>
                      <p className="text-sm text-foreground line-clamp-2">{c.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(c.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* APOSTILLE TAB */}
          <TabsContent value="apostille" className="space-y-6">
            <h2 className="font-sans text-xl font-semibold">Apostille Requests</h2>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold">Request New Apostille</h3>
                <div><Label>Document Description *</Label><Input value={apostilleForm.document_description} onChange={e => setApostilleForm({ ...apostilleForm, document_description: e.target.value })} placeholder="e.g. Birth Certificate" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Destination Country</Label><Input value={apostilleForm.destination_country} onChange={e => setApostilleForm({ ...apostilleForm, destination_country: e.target.value })} placeholder="e.g. Germany" /></div>
                  <div><Label>Number of Documents</Label><Input type="number" min="1" max="50" value={apostilleForm.document_count} onChange={e => setApostilleForm({ ...apostilleForm, document_count: e.target.value })} /></div>
                </div>
                <div><Label>Notes (optional)</Label><Textarea value={apostilleForm.notes} onChange={e => setApostilleForm({ ...apostilleForm, notes: e.target.value })} rows={2} placeholder="Urgency, special instructions" maxLength={500} /></div>
                <Button disabled={!apostilleForm.document_description.trim() || submittingApostille} onClick={async () => {
                  if (!user) return;
                  setSubmittingApostille(true);
                  const { data: newReq, error } = await supabase.from("apostille_requests").insert({ client_id: user.id, document_description: apostilleForm.document_description.trim(), notes: apostilleForm.notes.trim() || null, destination_country: apostilleForm.destination_country.trim() || null, document_count: parseInt(apostilleForm.document_count) || 1 }).select().single();
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  else if (newReq) { toast({ title: "Apostille request submitted" }); setApostilleRequests(prev => [newReq, ...prev]); setApostilleForm({ document_description: "", notes: "", destination_country: "", document_count: "1" }); }
                  setSubmittingApostille(false);
                }} className="">
                  {submittingApostille ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />} Submit Request
                </Button>
              </CardContent>
            </Card>
            {apostilleRequests.length > 0 && apostilleRequests.map(req => {
              const apoSteps = ["intake", "payment_received", "submitted_to_sos", "processing", "shipped", "delivered"];
              const apoLabels = ["Intake", "Payment", "SOS", "Processing", "Shipped", "Delivered"];
              const currentIdx = apoSteps.indexOf(req.status);
              return (
                <Card key={req.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{req.document_description}</span><Badge className={req.status === "delivered" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>{req.status.replace(/_/g, " ")}</Badge></div>
                    <div className="flex items-center gap-1 my-3">{apoSteps.map((s, i) => (<div key={s} className="flex items-center flex-1"><div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i < currentIdx ? "✓" : i + 1}</div>{i < apoSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? "bg-accent" : "bg-muted"}`} />}</div>))}</div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mb-2">{apoLabels.map(l => <span key={l}>{l}</span>)}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Fee: ${parseFloat(req.fee || "0").toFixed(2)}</span>
                      {req.destination_country && <span>→ {req.destination_country}</span>}
                      {req.tracking_number && <span>Tracking: {req.tracking_number}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xl font-semibold">Payments & Invoices</h2>
              {!showPaymentForm && <Button size="sm" onClick={() => setShowPaymentForm(true)}><CreditCard className="mr-1 h-4 w-4" /> Make Payment</Button>}
            </div>
            {showPaymentForm && <PaymentForm onSuccess={() => { setShowPaymentForm(false); supabase.from("payments").select("*").eq("client_id", user!.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setPayments(data); }); }} onCancel={() => setShowPaymentForm(false)} />}
            {payments.length === 0 && !showPaymentForm ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><p>No payment history yet</p></CardContent></Card>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map(p => {
                  const linkedAppt = appointments.find(a => a.id === p.appointment_id);
                  return (
                    <Card key={p.id} className="border-border/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-sm">${parseFloat(p.amount).toFixed(2)}</p>
                          {linkedAppt && <p className="text-xs text-primary font-medium">{linkedAppt.service_type}</p>}
                          <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {p.method || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.status === "pending" && <Button size="sm" className="text-xs " onClick={() => setPayingPaymentId(p.id)}><CreditCard className="mr-1 h-3 w-3" /> Pay Now</Button>}
                          <Badge className={p.status === "paid" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : p.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}>{p.status}</Badge>
                          {p.invoice_url && <a href={p.invoice_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="text-xs">View Invoice</Button></a>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {payingPaymentId && <PaymentForm defaultAmount={parseFloat(payments.find(p => p.id === payingPaymentId)?.amount || "0")} onSuccess={async () => { await supabase.from("payments").update({ status: "paid", paid_at: new Date().toISOString(), method: "stripe" } as any).eq("id", payingPaymentId); setPayments(prev => prev.map(p => p.id === payingPaymentId ? { ...p, status: "paid" } : p)); setPayingPaymentId(null); toast({ title: "Payment successful!" }); }} onCancel={() => setPayingPaymentId(null)} />}
              </div>
            ) : null}
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="space-y-6">
            <h2 className="font-sans text-xl font-semibold">Leave a Review</h2>
            {past.filter(a => a.status === "completed").length > 0 && (
              <Card className="border-border/50"><CardContent className="p-4 space-y-4">
                <div><Label>Select Appointment</Label><Select value={reviewForm.appointment_id} onValueChange={v => setReviewForm({ ...reviewForm, appointment_id: v })}><SelectTrigger><SelectValue placeholder="Choose completed appointment..." /></SelectTrigger><SelectContent>{past.filter(a => a.status === "completed" && !reviews.some(r => r.appointment_id === a.id)).map(a => <SelectItem key={a.id} value={a.id}>{a.service_type} — {formatDate(a.scheduled_date)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Rating</Label><div className="flex gap-1 mt-1">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="p-1"><Star className={`h-6 w-6 ${n <= reviewForm.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} /></button>)}</div></div>
                <div><Label>Comment (optional)</Label><Textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Tell us about your experience..." /></div>
                <Button disabled={!reviewForm.appointment_id || submittingReview} onClick={async () => {
                  if (!user || !reviewForm.appointment_id) return;
                  setSubmittingReview(true);
                  const { error } = await supabase.from("reviews").insert({ client_id: user.id, appointment_id: reviewForm.appointment_id, rating: reviewForm.rating, comment: reviewForm.comment || null });
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  else { toast({ title: "Review submitted!" }); setReviewForm({ appointment_id: "", rating: 5, comment: "" }); const { data: revs } = await supabase.from("reviews").select("*").eq("client_id", user.id); if (revs) setReviews(revs); }
                  setSubmittingReview(false);
                }} className="">{submittingReview ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Star className="mr-1 h-4 w-4" />} Submit Review</Button>
              </CardContent></Card>
            )}
            {reviews.length > 0 && <><h3 className="font-sans text-lg font-semibold mt-6">Your Reviews</h3><div className="space-y-3">{reviews.map(r => <Card key={r.id} className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-1 mb-2">{[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />)}</div>{r.comment && <p className="text-sm">{r.comment}</p>}<p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p></CardContent></Card>)}</div></>}
          </TabsContent>

          {/* SERVICE REQUESTS TAB */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="font-sans text-xl font-semibold">Service Requests</h2><Link to="/request"><Button size="sm" className=""><Plus className="mr-1 h-4 w-4" /> New Request</Button></Link></div>
            {serviceRequests.length === 0 ? (
              <Card className="border-border/50"><CardContent className="flex flex-col items-center py-12 text-center"><Clock className="mb-4 h-12 w-12 text-muted-foreground/50" /><p className="text-muted-foreground">No service requests yet</p></CardContent></Card>
            ) : (
              <div className="space-y-3">{serviceRequests.map(req => {
                const intakeData = typeof req.intake_data === 'object' ? req.intake_data : {};
                return (<Card key={req.id} className="border-border/50"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><div><p className="font-medium text-sm">{req.service_name}</p><p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p></div><Badge className={req.status === "completed" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : req.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>{req.status.replace(/_/g, " ")}</Badge></div>
                {Object.entries(intakeData).length > 0 && <div className="mt-2 text-xs text-muted-foreground space-y-1">{Object.entries(intakeData).slice(0, 4).map(([key, value]) => <p key={key}><span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span> {String(value)}</p>)}</div>}
                {req.notes && <p className="text-xs text-muted-foreground mt-2 italic">{req.notes}</p>}</CardContent></Card>);
              })}</div>
            )}
          </TabsContent>

          {/* REMINDERS TAB */}
          <TabsContent value="reminders" className="space-y-6">
            <h2 className="font-sans text-xl font-semibold">Document Reminders & Renewals</h2>
            <Card className="border-border/50"><CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold">Set Expiry Reminder</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label>Document</Label><Select value={reminderForm.document_id} onValueChange={v => setReminderForm({ ...reminderForm, document_id: v })}><SelectTrigger className="text-xs"><SelectValue placeholder="Select document..." /></SelectTrigger><SelectContent>{documents.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.file_name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Expiry Date</Label><Input type="date" value={reminderForm.expiry_date} onChange={e => setReminderForm({ ...reminderForm, expiry_date: e.target.value })} /></div>
                <div><Label>Remind Before</Label><Select value={reminderForm.remind_days_before} onValueChange={v => setReminderForm({ ...reminderForm, remind_days_before: v })}><SelectTrigger className="text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem><SelectItem value="60">60 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select></div>
              </div>
              <Button disabled={!reminderForm.document_id || !reminderForm.expiry_date || savingReminder} onClick={async () => {
                if (!user) return;
                setSavingReminder(true);
                const { data, error } = await supabase.from("document_reminders").insert({ user_id: user.id, document_id: reminderForm.document_id, expiry_date: reminderForm.expiry_date, remind_days_before: parseInt(reminderForm.remind_days_before) } as any).select().single();
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                else if (data) { toast({ title: "Reminder set" }); setReminders(prev => [...prev, data].sort((a: any, b: any) => a.expiry_date.localeCompare(b.expiry_date))); setReminderForm({ document_id: "", expiry_date: "", remind_days_before: "30" }); }
                setSavingReminder(false);
              }} size="sm" className="">{savingReminder ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Bell className="mr-1 h-4 w-4" />} Set Reminder</Button>
            </CardContent></Card>
            {reminders.length === 0 ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><p>No reminders set</p></CardContent></Card>
            ) : (
              <div className="space-y-3">{reminders.map((rem: any) => {
                const doc = documents.find(d => d.id === rem.document_id);
                const expiryDate = new Date(rem.expiry_date + "T00:00:00");
                const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= rem.remind_days_before, isExpired = daysUntil <= 0;
                return (<Card key={rem.id} className={`border-border/50 ${isExpired ? "border-destructive/50" : isUrgent ? "border-amber-500/50" : ""}`}><CardContent className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><Bell className={`h-5 w-5 ${isExpired ? "text-destructive" : isUrgent ? "text-amber-500" : "text-muted-foreground"}`} /><div><p className="text-sm font-medium">{doc?.file_name || "Unknown document"}</p><p className="text-xs text-muted-foreground">Expires: {expiryDate.toLocaleDateString()} · Remind {rem.remind_days_before}d before</p></div></div><div className="flex items-center gap-2"><Badge className={isExpired ? "bg-destructive/10 text-destructive" : isUrgent ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}>{isExpired ? "Expired" : `${daysUntil}d remaining`}</Badge><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => { const { error } = await supabase.from("document_reminders").delete().eq("id", rem.id); if (!error) { setReminders(prev => prev.filter((r: any) => r.id !== rem.id)); toast({ title: "Reminder removed" }); } }}><XCircle className="h-3 w-3" /></Button></div></CardContent></Card>);
              })}</div>
            )}
          </TabsContent>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="font-sans text-xl font-semibold">Available Services</h2><Button variant="outline" size="sm" onClick={() => setShowWizard(!showWizard)}><Sparkles className="mr-1 h-3 w-3" /> {showWizard ? "Hide Guide" : "Not Sure What You Need?"}</Button></div>
            <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"><FileText className="h-5 w-5 text-primary" /></div><div><h3 className="text-sm font-semibold text-foreground">Digitize Documents</h3><p className="text-xs text-muted-foreground">Upload scanned documents and convert them to editable digital formats with AI-powered OCR</p></div></div><Link to="/digitize"><Button size="sm" className=""><ArrowRight className="mr-1 h-3 w-3" /> Start</Button></Link></CardContent></Card>
            {showWizard && <DocumentWizard onSelectService={svc => { setShowWizard(false); navigate(`/book?service=${encodeURIComponent(svc)}`); }} onClose={() => setShowWizard(false)} />}
            <div className="grid gap-4 sm:grid-cols-2">{services.map(svc => (
              <Card key={svc.id} className="border-border/50 hover:shadow-sm transition-shadow"><CardContent className="p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold text-foreground">{svc.name}</h3>{svc.short_description && <p className="text-xs text-muted-foreground mt-1">{svc.short_description}</p>}</div><Badge variant="outline" className="text-xs shrink-0 ml-2">{svc.pricing_model === "custom" ? "Quote" : svc.price_from ? `$${svc.price_from}${svc.price_to && svc.price_to > svc.price_from ? `–$${svc.price_to}` : ""}` : "Contact"}</Badge></div>{svc.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{svc.description}</p>}<div className="flex gap-2 mt-3"><Link to={getServiceUrl(svc)}><Button size="sm" className="text-xs ">{getServiceCTA(svc)}</Button></Link><Link to={`/services/${svc.id}`}><Button size="sm" variant="outline" className="text-xs">View Details</Button></Link></div></CardContent></Card>
            ))}</div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={explainDialogOpen} onOpenChange={setExplainDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-sans flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Document Explanation</DialogTitle></DialogHeader>
          {explaining ? <div className="flex flex-col items-center py-8 gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Analyzing document...</p></div> : explanation ? <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm">{explanation}</div> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelDialogId} onOpenChange={() => { setCancelDialogId(null); setCancelReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Appointment</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
          <div className="py-2">
            <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
            <Textarea id="cancel-reason" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g., scheduling conflict, no longer needed..." rows={2} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialogId(null); setCancelReason(""); }}>Keep Appointment</Button>
            <Button variant="destructive" onClick={() => { if (cancelDialogId) cancelAppointment(cancelDialogId); setCancelReason(""); }} disabled={cancelling}>{cancelling ? "Cancelling..." : "Cancel Appointment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign in again to access your portal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction onClick={signOut}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-sans flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: formatPhone(e.target.value) })} placeholder="(614) 555-1234" /></div>
            <div><Label>Address</Label><Input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>City</Label><Input value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={profileForm.state} onChange={e => setProfileForm({ ...profileForm, state: e.target.value })} maxLength={2} /></div>
              <div><Label>Zip</Label><Input value={profileForm.zip} onChange={e => setProfileForm({ ...profileForm, zip: e.target.value })} maxLength={5} /></div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile} className="">{savingProfile ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save</Button>
          </DialogFooter>
          <div className="mt-6 border-t border-destructive/20 pt-4">
            <p className="text-sm font-medium text-destructive mb-1">Close Account</p>
            <p className="text-xs text-muted-foreground mb-3">This will permanently delete your account and all associated data.</p>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Close My Account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your account, all appointments, documents, and data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { if (!user) return; await supabase.from("document_reminders").delete().eq("user_id", user.id); await supabase.from("reviews").delete().eq("client_id", user.id); await supabase.from("chat_messages").delete().eq("sender_id", user.id); await supabase.from("documents").delete().eq("uploaded_by", user.id); await supabase.from("appointments").delete().eq("client_id", user.id); await supabase.from("profiles").delete().eq("user_id", user.id); await supabase.from("user_roles").delete().eq("user_id", user.id); toast({ title: "Account closed" }); signOut(); }}>Yes, close my account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm text-center"><DialogHeader><DialogTitle className="font-sans">Scan to Upload from Mobile</DialogTitle></DialogHeader><div className="flex justify-center py-4"><QRCodeSVG value={qrUrl} size={200} level="H" /></div><p className="text-sm text-muted-foreground">Scan this QR code with your phone to upload documents or join a session.</p></DialogContent>
      </Dialog>

      <Dialog open={techCheckOpen} onOpenChange={setTechCheckOpen}>
        <DialogContent className="sm:max-w-md"><TechCheck onComplete={() => setTechCheckOpen(false)} /></DialogContent>
      </Dialog>
    </div>
  );
}
