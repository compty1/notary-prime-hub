import React, { useEffect, useState, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { INTAKE_ONLY_SERVICES, SAAS_LINKS, SUBSCRIPTION_SERVICES as SUBSCRIPTION_SVC_SET, PORTAL_SERVICES as PORTAL_SVC_SET } from "@/lib/serviceConstants";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/ClientSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, LogOut, Shield, FileText, CheckCircle, User, Pencil, Save, Loader2, Upload, FolderOpen, QrCode, ArrowRight, MessageSquare, Send, Sparkles, Eye, DollarSign, Star, ShoppingBag, Mail, Package, CreditCard, Bell, XCircle, Home, Search, ChevronRight, AlertCircle, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import DocumentWizard from "@/components/DocumentWizard";
import ClientProgressTracker from "@/components/ClientProgressTracker";
import PaymentForm from "@/components/PaymentForm";
import TechCheck from "@/components/TechCheck";
import { Logo } from "@/components/Logo";
import { formatPhone } from "@/lib/formatPhone";
import PortalAppointmentsTab from "./portal/PortalAppointmentsTab";
import PortalDocumentsTab from "./portal/PortalDocumentsTab";
import PortalChatTab from "./portal/PortalChatTab";
import PortalCorrespondenceTab from "./portal/PortalCorrespondenceTab";
import PortalServiceRequestsTab from "./portal/PortalServiceRequestsTab";
import { PortalLoadingSkeleton } from "@/components/PortalLoadingSkeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PortalOnboardingChecklist } from "@/components/PortalOnboardingChecklist";
import { PortalQuickActions } from "@/components/PortalQuickActions";
import { DocumentReadinessScore } from "@/components/DocumentReadinessScore";
import { ReferralPortal } from "@/components/ReferralPortal";
import PortalAIToolsTab from "./portal/PortalAIToolsTab";
import PortalNotaryPageTab from "./portal/PortalNotaryPageTab";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [activeSection, setActiveSection] = useState(initialTab);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  usePageMeta({ title: "Client Portal", description: "Manage your appointments, documents, and communications in one place.", noIndex: true });
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
  const { get: getSetting } = useSettings(["zoom_meeting_link"]);
  const zoomLink = getSetting("zoom_meeting_link", "");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderForm, setReminderForm] = useState({ document_id: "", expiry_date: "", remind_days_before: "30" });
  const [savingReminder, setSavingReminder] = useState(false);
  const [portalSearch, setPortalSearch] = useState("");

  const INTAKE_ONLY = INTAKE_ONLY_SERVICES;
  const SAAS_TOOLS = SAAS_LINKS;
  const SUBSCRIPTION_SERVICES = SUBSCRIPTION_SVC_SET;
  const PORTAL_SERVICES = PORTAL_SVC_SET;

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
    return "Notarize Now";
  };

  const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  // Note: local formatDate used here for specific weekday format; shared utils formatDate used elsewhere

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
      // zoom_meeting_link is fetched via useSettings hook below
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

    const chatChannel = supabase.channel("client-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `recipient_id=eq.${user.id}` }, (payload) => {
      const msg = payload.new as any;
      if (msg.sender_id === user.id || (msg.is_admin && msg.recipient_id === user.id)) setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    }).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `sender_id=eq.${user.id}` }, (payload) => {
      const msg = payload.new as any;
      setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    }).subscribe();

    const apptChannel = supabase.channel("client-appointments").on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `client_id=eq.${user.id}` }, (payload) => {
      const updated = payload.new as any;
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a)); toast({ title: "Appointment updated", description: `Status: ${updated.status.replace(/_/g, " ")}` });
    }).subscribe();

    const paymentChannel = supabase.channel("client-payments").on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `client_id=eq.${user.id}` }, (payload) => {
      const record = (payload.new || payload.old) as any;
      if (payload.eventType === "INSERT") { setPayments(prev => [payload.new as any, ...prev]); toast({ title: "New payment request", description: `Amount: $${(payload.new as any).amount}` }); }
      else if (payload.eventType === "UPDATE") setPayments(prev => prev.map(p => p.id === record.id ? payload.new as any : p));
    }).subscribe();

    const docChannel = supabase.channel("client-documents").on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `uploaded_by=eq.${user.id}` }, (payload) => {
      if (payload.eventType === "INSERT") { setDocuments(prev => prev.some(d => d.id === (payload.new as any).id) ? prev : [payload.new as any, ...prev]); toast({ title: "Document uploaded", description: (payload.new as any).file_name }); }
      else if (payload.eventType === "UPDATE") setDocuments(prev => prev.map(d => d.id === (payload.new as any).id ? payload.new as any : d));
      else if (payload.eventType === "DELETE") setDocuments(prev => prev.filter(d => d.id !== (payload.old as any).id));
    }).subscribe();

    return () => { supabase.removeChannel(chatChannel); supabase.removeChannel(apptChannel); supabase.removeChannel(paymentChannel); supabase.removeChannel(docChannel); };
  }, [user]);

  const searchLower = portalSearch.toLowerCase();
  const filteredAppointments = portalSearch ? appointments.filter(a => a.service_type?.toLowerCase().includes(searchLower) || a.scheduled_date?.includes(portalSearch) || a.status?.toLowerCase().includes(searchLower)) : appointments;
  const upcoming = filteredAppointments.filter(a => ["scheduled", "confirmed", "id_verification", "kba_pending"].includes(a.status));
  const past = filteredAppointments.filter(a => ["completed", "cancelled", "no_show"].includes(a.status));
  const filteredDocuments = portalSearch ? documents.filter(d => d.file_name?.toLowerCase().includes(searchLower) || d.status?.toLowerCase().includes(searchLower)) : documents;
  const filteredPayments = portalSearch ? payments.filter(p => p.amount?.toString().includes(portalSearch) || p.status?.toLowerCase().includes(searchLower) || p.notes?.toLowerCase().includes(searchLower)) : payments;

  const cancelAppointment = async (id: string) => {
    // Check if appointment is cancellable
    const appt = appointments.find(a => a.id === id);
    if (appt && ["in_session", "completed", "cancelled"].includes(appt.status)) {
      toast({ title: "Cannot cancel", description: `This appointment is already ${appt.status.replace(/_/g, " ")}.`, variant: "destructive" });
      setCancelDialogId(null);
      return;
    }
    setCancelling(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelled" as any, admin_notes: cancelReason ? `Client cancel reason: ${cancelReason}` : null } as any).eq("id", id).eq("client_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Appointment cancelled" }); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a)); setCancelReason(""); try { await supabase.functions.invoke("send-appointment-emails", { body: { appointmentId: id, emailType: "cancellation", cancelReason: cancelReason || undefined } }); } catch (e) { console.error("Cancellation email error:", e); } }
    setCancelling(false); setCancelDialogId(null);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    // Validate profile fields
    if (!profileForm.full_name.trim()) { toast({ title: "Validation Error", description: "Full name is required.", variant: "destructive" }); return; }
    if (profileForm.phone && !/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(profileForm.phone.replace(/\s+/g, ""))) { toast({ title: "Validation Error", description: "Please enter a valid phone number.", variant: "destructive" }); return; }
    if (profileForm.zip && !/^\d{5}(-\d{4})?$/.test(profileForm.zip)) { toast({ title: "Validation Error", description: "Please enter a valid 5-digit zip code.", variant: "destructive" }); return; }
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: profileForm.full_name.trim(), phone: profileForm.phone || null, address: profileForm.address || null, city: profileForm.city || null, state: profileForm.state || null, zip: profileForm.zip || null }).eq("user_id", user.id);
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
    // Sanitize chat input before insert to prevent stored XSS (Issue 1.6)
    const sanitizedMessage = chatInput.trim().replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
    const { error } = await supabase.from("chat_messages").insert({ sender_id: user.id, message: sanitizedMessage, is_admin: false, recipient_id: chatRecipient || null });
    if (error) toast({ title: "Error sending message", variant: "destructive" });
    else setChatInput("");
    setSendingChat(false);
  };

  // Only auto-scroll on NEW messages, not initial load (Issue 3.3)
  const prevChatCountRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length > prevChatCountRef.current && prevChatCountRef.current > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevChatCountRef.current = chatMessages.length;
  }, [chatMessages]);

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

  const selectedApptId = appointments.find(a => ["scheduled", "confirmed"].includes(a.status))?.id;
  const qrUrl = `${window.location.origin}/mobile-upload${selectedApptId ? `?appointment_id=${selectedApptId}` : ""}`;
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <PortalLoadingSkeleton />
      </div>
    );
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ tab: section }, { replace: true });
    if (section === "chat" && user && unreadCount > 0) {
      const unreadIds = chatMessages.filter(m => m.is_admin && !m.read).map(m => m.id);
      if (unreadIds.length > 0) supabase.from("chat_messages").update({ read: true }).in("id", unreadIds).then(() => { setChatMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m)); setUnreadCount(0); });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ClientSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          profile={profile}
          unreadCount={unreadCount}
          onSignOut={() => setLogoutDialogOpen(true)}
        />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 h-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-400 hover:text-foreground" />
              <div className="hidden md:flex items-center bg-[#f8f9fa] rounded-full px-4 py-2 w-80">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input type="text" placeholder="Search appointments or documents..." value={portalSearch} onChange={e => setPortalSearch(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 text-gray-400 hover:bg-[#f8f9fa] rounded-full relative" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {(payments.filter(p => p.status === "pending").length + unreadCount) > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-[24px] border-gray-100" align="end">
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="text-sm font-black text-[#212529]">Notifications</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {payments.filter(p => p.status === "pending").map(p => (
                      <div key={p.id} className="p-3 hover:bg-[#f8f9fa] cursor-pointer" onClick={() => handleSectionChange("payments")}>
                        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-destructive" /><span className="text-sm font-bold text-[#212529]">Payment Due: ${Number(p.amount).toFixed(2)}</span></div>
                        <p className="text-xs text-gray-400 font-medium ml-6">{p.notes || "Pending payment"}</p>
                      </div>
                    ))}
                    {upcoming.slice(0, 3).map(a => (
                      <div key={a.id} className="p-3 hover:bg-[#f8f9fa] cursor-pointer" onClick={() => handleSectionChange("appointments")}>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#eab308]" /><span className="text-sm font-bold text-[#212529]">{a.service_type}</span></div>
                        <p className="text-xs text-gray-400 font-medium ml-6">{formatDate(a.scheduled_date)} at {a.scheduled_time}</p>
                      </div>
                    ))}
                    {unreadCount > 0 && (
                      <div className="p-3 hover:bg-[#f8f9fa] cursor-pointer" onClick={() => handleSectionChange("chat")}>
                        <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#eab308]" /><span className="text-sm font-bold text-[#212529]">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</span></div>
                      </div>
                    )}
                    {payments.filter(p => p.status === "pending").length === 0 && upcoming.length === 0 && unreadCount === 0 && (
                      <div className="p-6 text-center text-sm text-gray-400 font-medium">No notifications</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {isAdmin && <Link to="/admin"><Button variant="outline" size="sm" className="rounded-xl font-bold">Admin</Button></Link>}
              <Link to="/book">
                <Button size="sm" className="rounded-full bg-[#eab308] text-white font-bold hover:bg-[#eab308]/90 shadow-block hover:-translate-y-0.5 active:translate-y-0 active:shadow-block-active transition-all">
                  <Plus className="mr-1 h-4 w-4" /> New Notarization
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-[#f8f9fa] min-h-[calc(100vh-5rem)]" aria-live="polite">
            <div className="max-w-6xl mx-auto space-y-6" role="region" aria-label={`${activeSection} section`}>

          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="space-y-6">
            {/* Active Session Banner */}
            {appointments.some(a => a.status === "in_session") && (
              <Card className="rounded-[24px] border-[#eab308]/30 bg-[#eab308]/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#eab308]/20 animate-pulse"><Shield className="h-5 w-5 text-[#eab308]" /></div>
                    <div>
                      <p className="font-black text-sm text-[#212529]">Your notarization session is active</p>
                      <p className="text-xs text-gray-400 font-medium">Join now to complete your notarization</p>
                    </div>
                  </div>
                  <Link to={`/ron-session?id=${appointments.find(a => a.status === "in_session")?.id}`}>
                    <Button size="sm" className="rounded-xl bg-[#212529] text-white font-bold shadow-block">Join Session <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Upcoming Appts</p>
                <p className="text-4xl font-black text-[#212529]">{upcoming.length}</p>
              </CardContent></Card>
              <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Documents</p>
                <p className="text-4xl font-black text-[#212529]">{documents.length}</p>
              </CardContent></Card>
              <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Paid</p>
                <p className="text-4xl font-black text-[#212529]">${payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0).toFixed(0)}</p>
              </CardContent></Card>
              <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Action Needed</p>
                <p className="text-4xl font-black text-[#212529]">{payments.filter(p => p.status === "pending").length + unreadCount}</p>
              </CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PortalOnboardingChecklist profile={profile} documents={documents} appointments={appointments} onEditProfile={() => setEditProfileOpen(true)} />
                <Card className="rounded-[24px] border-gray-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-[#212529]">Upcoming Appointments</h3>
                      <Link to="/book"><Button size="sm" variant="outline" className="rounded-xl font-bold text-xs">Book New</Button></Link>
                    </div>
                    {upcoming.length === 0 ? (
                      <div className="py-8 text-center"><Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" /><p className="text-sm text-gray-400 font-medium">No upcoming appointments</p></div>
                    ) : (
                      <div className="space-y-3">{upcoming.slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fa] hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center"><FileText className="h-5 w-5 text-[#eab308]" /></div>
                            <div><p className="text-sm font-bold text-[#212529]">{a.service_type}</p><p className="text-xs text-gray-400 font-medium">{formatDate(a.scheduled_date)} at {a.scheduled_time}</p></div>
                          </div>
                          <Badge className="text-[10px] font-black uppercase tracking-wider bg-[#f8f9fa] text-gray-500 border-gray-200 rounded-lg">{a.status.replace(/_/g, " ")}</Badge>
                        </div>
                      ))}</div>
                    )}
                  </CardContent>
                </Card>
                {payments.filter(p => p.status === "pending").length > 0 && (
                  <Card className="rounded-[24px] border-destructive/30 bg-destructive/5">
                    <CardContent className="p-6">
                      <h3 className="font-black text-[#212529] mb-3">Pending Payments</h3>
                      {payments.filter(p => p.status === "pending").slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white mb-2">
                          <div><p className="text-sm font-bold text-[#212529]">${Number(p.amount).toFixed(2)}</p><p className="text-xs text-gray-400 font-medium">{p.notes || "Payment pending"}</p></div>
                          <Button size="sm" className="rounded-xl font-bold text-xs" onClick={() => handleSectionChange("payments")}><CreditCard className="mr-1 h-3 w-3" /> Pay Now</Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {upcoming.length > 0 && <DocumentReadinessScore serviceType={upcoming[0].service_type} uploadedDocuments={documents.map((d: any) => ({ file_name: d.file_name, status: d.status }))} />}
                <div className="bg-[#212529] rounded-[24px] p-6 text-white relative overflow-hidden group cursor-pointer" onClick={() => setShowWizard(true)}>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Sparkles className="h-24 w-24" /></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-black mb-2 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#eab308]" /> AI Document Wizard</h3>
                    <p className="text-sm text-gray-400 font-medium mb-4 leading-relaxed">Have our AI review your documents for common errors before your appointment.</p>
                    <Button size="sm" className="font-bold rounded-xl bg-[#eab308] text-white" onClick={e => { e.stopPropagation(); setShowWizard(true); }}>Start AI Review</Button>
                  </div>
                </div>

                {appointments.some((a: any) => a.notarization_type === "ron" && ["scheduled", "confirmed"].includes(a.status)) && (() => {
                  const ronAppt = appointments.find((a: any) => a.notarization_type === "ron" && ["scheduled", "confirmed"].includes(a.status));
                  const hasDocuments = documents.length > 0;
                  return (
                    <Card className="rounded-[24px] border-[#eab308]/20 bg-[#eab308]/5">
                      <CardContent className="p-5">
                        <h4 className="font-black text-sm text-[#212529] flex items-center gap-2 mb-3"><Shield className="h-4 w-4 text-[#eab308]" /> Session Prep Checklist</h4>
                        <p className="text-xs text-gray-400 font-medium mb-3">Your RON session is{" "}{ronAppt ? new Date(ronAppt.scheduled_date + "T" + ronAppt.scheduled_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "soon"}.</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">{hasDocuments ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-gray-400" />}<span className={hasDocuments ? "text-[#212529] font-medium" : "text-gray-400 font-medium"}>Documents uploaded</span></div>
                          <div className="flex items-center gap-2 text-xs"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /><span className="text-[#212529] font-medium">Government photo ID ready</span></div>
                          <div className="flex items-center gap-2 text-xs"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /><span className="text-[#212529] font-medium">Camera & microphone access</span></div>
                        </div>
                        <Link to={`/ron-session?id=${ronAppt?.id}`}><Button size="sm" className="w-full mt-3 text-xs rounded-xl font-bold bg-[#212529] text-white">Go to Session</Button></Link>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Card className="rounded-[24px] bg-[#eab308]/5 border-[#eab308]/20">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="shrink-0 text-[#eab308]"><Eye className="h-6 w-6" /></div>
                      <div>
                        <h4 className="font-black text-sm text-[#212529]">Need Help?</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">Our support team is available 24/7.</p>
                        <button onClick={() => handleSectionChange("chat")} className="mt-3 text-[#eab308] text-xs font-bold underline">Message Support</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <PortalQuickActions />
              </div>
            </div>

            <ClientProgressTracker appointments={appointments} documents={documents} />
            </div>
          )}

          {activeSection === "appointments" && (
            <PortalAppointmentsTab appointments={appointments} loading={loading} zoomLink={zoomLink} onCancelClick={setCancelDialogId} onTechCheck={() => setTechCheckOpen(true)} />
          )}

          {activeSection === "documents" && user && (
            <PortalDocumentsTab userId={user.id} documents={documents} setDocuments={setDocuments} upcomingAppointments={upcoming} onExplainDocument={explainDocument} />
          )}

          {activeSection === "status" && (
            <div className="space-y-6">
            <h2 className="text-xl font-black text-[#212529]">Document Pipeline</h2>
            {documents.length === 0 ? (
              <Card className="rounded-[24px] border-gray-100"><CardContent className="py-12 text-center text-gray-400"><FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" /><p className="font-medium">No documents to track</p></CardContent></Card>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <Card key={doc.id} className="rounded-[24px] border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-[#212529] truncate">{doc.file_name}</span><Badge className="text-[10px] font-black uppercase tracking-wider bg-[#f8f9fa] text-gray-500 border-gray-200 rounded-lg">{doc.status.replace(/_/g, " ")}</Badge></div>
                      <Progress value={getDocPipelineProgress(doc.status)} className="h-2" />
                      <div className="flex justify-between mt-2">
                        {pipelineSteps.map((ps, i) => {
                          const isComplete = pipelineSteps.findIndex(s => s.key === doc.status) >= i;
                          return <div key={ps.key} className="flex flex-col items-center gap-1"><ps.icon className={`h-3 w-3 ${isComplete ? "text-[#eab308]" : "text-gray-300"}`} /><span className={`text-[9px] font-bold ${isComplete ? "text-[#212529]" : "text-gray-300"}`}>{ps.label}</span></div>;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
          )}

          {activeSection === "chat" && user && (
            <PortalChatTab userId={user.id} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendingChat={sendingChat} chatRecipient={chatRecipient} setChatRecipient={setChatRecipient} staffUsers={staffUsers} onSend={sendChatMessage} chatEndRef={chatEndRef as React.RefObject<HTMLDivElement>} />
          )}

          {activeSection === "correspondence" && user && (
            <PortalCorrespondenceTab userId={user.id} correspondence={correspondence} setCorrespondence={setCorrespondence} />
          )}

          {activeSection === "apostille" && (
            <div className="space-y-6">
            <h2 className="text-xl font-black text-foreground">Apostille Requests</h2>
            <Card className="rounded-[24px] border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-black text-foreground">Request New Apostille</h3>
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Description *</Label><Input value={apostilleForm.document_description} onChange={e => setApostilleForm({ ...apostilleForm, document_description: e.target.value })} placeholder="e.g. Birth Certificate" className="bg-muted border-none rounded-xl mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination Country</Label><Input value={apostilleForm.destination_country} onChange={e => setApostilleForm({ ...apostilleForm, destination_country: e.target.value })} placeholder="e.g. Germany" className="bg-muted border-none rounded-xl mt-1" /></div>
                  <div><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Number of Documents</Label><Input type="number" min="1" max="50" value={apostilleForm.document_count} onChange={e => setApostilleForm({ ...apostilleForm, document_count: e.target.value })} className="bg-muted border-none rounded-xl mt-1" /></div>
                </div>
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes (optional)</Label><Textarea value={apostilleForm.notes} onChange={e => setApostilleForm({ ...apostilleForm, notes: e.target.value })} rows={2} placeholder="Urgency, special instructions" maxLength={500} className="bg-[#f8f9fa] border-none rounded-xl mt-1" /></div>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button disabled={!apostilleForm.document_description.trim() || submittingApostille} className="rounded-xl font-bold bg-foreground text-background shadow-block">
                  {submittingApostille ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />} Submit Request
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Apostille Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Submit apostille request for &quot;{apostilleForm.document_description}&quot;{apostilleForm.destination_country ? ` to ${apostilleForm.destination_country}` : ""}? This will create a new service request.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                      if (!user) return;
                      setSubmittingApostille(true);
                      const { data: newReq, error } = await supabase.from("apostille_requests").insert({ client_id: user.id, document_description: apostilleForm.document_description.trim(), notes: apostilleForm.notes.trim() || null, destination_country: apostilleForm.destination_country.trim() || null, document_count: parseInt(apostilleForm.document_count) || 1 }).select().single();
                      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                      else if (newReq) { toast({ title: "Apostille request submitted" }); setApostilleRequests(prev => [newReq, ...prev]); setApostilleForm({ document_description: "", notes: "", destination_country: "", document_count: "1" }); }
                      setSubmittingApostille(false);
                    }}>Submit Request</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
               </CardContent>
            </Card>
            {apostilleRequests.length > 0 && apostilleRequests.map(req => {
              const apoSteps = ["intake", "payment_received", "submitted_to_sos", "processing", "shipped", "delivered"];
              const apoLabels = ["Intake", "Payment", "SOS", "Processing", "Shipped", "Delivered"];
              const currentIdx = apoSteps.indexOf(req.status);
              return (
                <Card key={req.id} className="rounded-[24px] border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-foreground">{req.document_description}</span><Badge className={`text-[10px] font-black uppercase tracking-wider rounded-lg ${req.status === "delivered" ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>{req.status.replace(/_/g, " ")}</Badge></div>
                    <div className="flex items-center gap-1 my-3">{apoSteps.map((s, i) => (<div key={s} className="flex items-center flex-1"><div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i < currentIdx ? "✓" : i + 1}</div>{i < apoSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? "bg-primary" : "bg-muted"}`} />}</div>))}</div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-2">{apoLabels.map(l => <span key={l}>{l}</span>)}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span>Fee: ${parseFloat(req.fee || "0").toFixed(2)}</span>
                      {req.destination_country && <span>→ {req.destination_country}</span>}
                      {req.tracking_number && <span>Tracking: {req.tracking_number}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}

          {activeSection === "payments" && (
            <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#212529]">Payments & Invoices</h2>
              {!showPaymentForm && <Button size="sm" onClick={() => setShowPaymentForm(true)} className="rounded-xl font-bold bg-[#212529] text-white shadow-block"><CreditCard className="mr-1 h-4 w-4" /> Make Payment</Button>}
            </div>
            {showPaymentForm && <PaymentForm onSuccess={() => { setShowPaymentForm(false); supabase.from("payments").select("*").eq("client_id", user!.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setPayments(data); }); }} onCancel={() => setShowPaymentForm(false)} />}
            {payments.length === 0 && !showPaymentForm ? (
              <Card className="rounded-[24px] border-gray-100"><CardContent className="py-12 text-center text-gray-400"><DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" /><p className="font-medium">No payment history yet</p></CardContent></Card>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map(p => {
                  const linkedAppt = appointments.find(a => a.id === p.appointment_id);
                  return (
                    <Card key={p.id} className="rounded-[24px] border-gray-100 shadow-sm">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-black text-sm text-[#212529]">${parseFloat(p.amount).toFixed(2)}</p>
                          {linkedAppt && <p className="text-xs text-[#eab308] font-bold">{linkedAppt.service_type}</p>}
                          <p className="text-xs text-gray-400 font-medium">{new Date(p.created_at).toLocaleDateString()} · {p.method || "N/A"}{p.paid_at ? ` · Paid ${new Date(p.paid_at).toLocaleDateString()}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.status === "pending" && <Button size="sm" className="text-xs rounded-xl font-bold bg-[#212529] text-white" onClick={() => setPayingPaymentId(p.id)}><CreditCard className="mr-1 h-3 w-3" /> Pay Now</Button>}
                          <Badge className={`text-[10px] font-black uppercase tracking-wider rounded-lg ${p.status === "paid" ? "bg-emerald-50 text-emerald-600" : p.status === "pending" ? "bg-[#eab308]/10 text-[#eab308]" : "bg-gray-100 text-gray-400"}`}>{p.status}</Badge>
                          {p.invoice_url && <a href={p.invoice_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="text-xs rounded-xl font-bold">View Invoice</Button></a>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {payingPaymentId && <PaymentForm defaultAmount={parseFloat(payments.find(p => p.id === payingPaymentId)?.amount || "0")} onSuccess={async () => { setPayments(prev => prev.map(p => p.id === payingPaymentId ? { ...p, status: "processing" } : p)); setPayingPaymentId(null); toast({ title: "Payment processing", description: "Your payment is being confirmed." }); }} onCancel={() => setPayingPaymentId(null)} />}
              </div>
            ) : null}
            </div>
          )}

          {activeSection === "reviews" && (
            <div className="space-y-6">
            <h2 className="text-xl font-black text-[#212529]">Leave a Review</h2>
            {past.filter(a => a.status === "completed").length > 0 ? (
              <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6 space-y-4">
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Appointment</Label><Select value={reviewForm.appointment_id} onValueChange={v => setReviewForm({ ...reviewForm, appointment_id: v })}><SelectTrigger className="bg-[#f8f9fa] border-none rounded-xl mt-1"><SelectValue placeholder="Choose completed appointment..." /></SelectTrigger><SelectContent>{past.filter(a => a.status === "completed" && !reviews.some(r => r.appointment_id === a.id)).map(a => <SelectItem key={a.id} value={a.id}>{a.service_type} — {formatDate(a.scheduled_date)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label id="rating-label" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rating</Label><div className="flex gap-1 mt-1" role="radiogroup" aria-labelledby="rating-label">{[1,2,3,4,5].map(n => <button key={n} role="radio" aria-checked={reviewForm.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setReviewForm({ ...reviewForm, rating: n })} onKeyDown={e => { if (e.key === "ArrowRight" && reviewForm.rating < 5) setReviewForm({ ...reviewForm, rating: reviewForm.rating + 1 }); if (e.key === "ArrowLeft" && reviewForm.rating > 1) setReviewForm({ ...reviewForm, rating: reviewForm.rating - 1 }); }} tabIndex={reviewForm.rating === n ? 0 : -1} className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"><Star className={`h-6 w-6 ${n <= reviewForm.rating ? "text-[#eab308] fill-[#eab308]" : "text-gray-300"}`} /></button>)}</div></div>
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Comment (optional)</Label><Textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Tell us about your experience..." className="bg-[#f8f9fa] border-none rounded-xl mt-1" /></div>
                <Button disabled={!reviewForm.appointment_id || submittingReview} onClick={async () => {
                  if (!user || !reviewForm.appointment_id) return;
                  setSubmittingReview(true);
                  const { error } = await supabase.from("reviews").insert({ client_id: user.id, appointment_id: reviewForm.appointment_id, rating: reviewForm.rating, comment: reviewForm.comment || null });
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  else { toast({ title: "Review submitted!" }); setReviewForm({ appointment_id: "", rating: 5, comment: "" }); const { data: revs } = await supabase.from("reviews").select("*").eq("client_id", user.id); if (revs) setReviews(revs); }
                  setSubmittingReview(false);
                }} className="rounded-xl font-bold bg-[#212529] text-white shadow-block">{submittingReview ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Star className="mr-1 h-4 w-4" />} Submit Review</Button>
              </CardContent></Card>
            ) : (
              <Card className="rounded-[24px] border-gray-100"><CardContent className="py-12 text-center text-gray-400"><Star className="mx-auto mb-4 h-12 w-12 text-gray-300" /><p className="font-bold text-[#212529] mb-1">No reviews yet</p><p className="text-sm font-medium">Complete an appointment to leave feedback.</p></CardContent></Card>
            )}
            {reviews.length > 0 && <><h3 className="text-lg font-black text-[#212529] mt-6">Your Reviews</h3><div className="space-y-3">{reviews.map(r => <Card key={r.id} className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-1 mb-2">{[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "text-[#eab308] fill-[#eab308]" : "text-gray-300"}`} />)}</div>{r.comment && <p className="text-sm text-gray-500 font-medium">{r.comment}</p>}<p className="text-xs text-gray-400 font-medium mt-2">{new Date(r.created_at).toLocaleDateString()}</p></CardContent></Card>)}</div></>}
            </div>
          )}

          {activeSection === "requests" && (
            <PortalServiceRequestsTab serviceRequests={serviceRequests} />
          )}

          {activeSection === "reminders" && (
            <div className="space-y-6">
            <h2 className="text-xl font-black text-[#212529]">Document Reminders & Renewals</h2>
            <Card className="rounded-[24px] border-gray-100 shadow-sm"><CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-black text-[#212529]">Set Expiry Reminder</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Document</Label><Select value={reminderForm.document_id} onValueChange={v => setReminderForm({ ...reminderForm, document_id: v })}><SelectTrigger className="text-xs bg-[#f8f9fa] border-none rounded-xl mt-1"><SelectValue placeholder="Select document..." /></SelectTrigger><SelectContent>{documents.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.file_name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expiry Date</Label><Input type="date" value={reminderForm.expiry_date} onChange={e => setReminderForm({ ...reminderForm, expiry_date: e.target.value })} className="bg-[#f8f9fa] border-none rounded-xl mt-1" /></div>
                <div><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Remind Before</Label><Select value={reminderForm.remind_days_before} onValueChange={v => setReminderForm({ ...reminderForm, remind_days_before: v })}><SelectTrigger className="text-xs bg-[#f8f9fa] border-none rounded-xl mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem><SelectItem value="60">60 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select></div>
              </div>
              <Button disabled={!reminderForm.document_id || !reminderForm.expiry_date || savingReminder} onClick={async () => {
                if (!user) return;
                setSavingReminder(true);
                const { data, error } = await supabase.from("document_reminders").insert({ user_id: user.id, document_id: reminderForm.document_id, expiry_date: reminderForm.expiry_date, remind_days_before: parseInt(reminderForm.remind_days_before) } as any).select().single();
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                else if (data) { toast({ title: "Reminder set" }); setReminders(prev => [...prev, data].sort((a: any, b: any) => a.expiry_date.localeCompare(b.expiry_date))); setReminderForm({ document_id: "", expiry_date: "", remind_days_before: "30" }); }
                setSavingReminder(false);
              }} size="sm" className="rounded-xl font-bold bg-[#212529] text-white shadow-block">{savingReminder ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Bell className="mr-1 h-4 w-4" />} Set Reminder</Button>
            </CardContent></Card>
            {reminders.length === 0 ? (
              <Card className="rounded-[24px] border-gray-100"><CardContent className="py-12 text-center text-gray-400"><Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" /><p className="font-medium">No reminders set</p></CardContent></Card>
            ) : (
              <div className="space-y-3">{reminders.map((rem: any) => {
                const doc = documents.find(d => d.id === rem.document_id);
                const expiryDate = new Date(rem.expiry_date + "T00:00:00");
                const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= rem.remind_days_before, isExpired = daysUntil <= 0;
                return (<Card key={rem.id} className={`rounded-[24px] border-gray-100 shadow-sm ${isExpired ? "border-destructive/50" : isUrgent ? "border-[#eab308]/50" : ""}`}><CardContent className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><Bell className={`h-5 w-5 ${isExpired ? "text-destructive" : isUrgent ? "text-[#eab308]" : "text-gray-400"}`} /><div><p className="text-sm font-bold text-[#212529]">{doc?.file_name || "Unknown document"}</p><p className="text-xs text-gray-400 font-medium">Expires: {expiryDate.toLocaleDateString()} · Remind {rem.remind_days_before}d before</p></div></div><div className="flex items-center gap-2"><Badge className={`text-[10px] font-black uppercase tracking-wider rounded-lg ${isExpired ? "bg-destructive/10 text-destructive" : isUrgent ? "bg-[#eab308]/10 text-[#eab308]" : "bg-gray-100 text-gray-400"}`}>{isExpired ? "Expired" : `${daysUntil}d remaining`}</Badge><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => { const { error } = await supabase.from("document_reminders").delete().eq("id", rem.id); if (!error) { setReminders(prev => prev.filter((r: any) => r.id !== rem.id)); toast({ title: "Reminder removed" }); } }}><XCircle className="h-3 w-3" /></Button></div></CardContent></Card>);
              })}</div>
            )}
            </div>
          )}

          {activeSection === "services" && (
            <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black text-[#212529]">Available Services</h2><Button variant="outline" size="sm" onClick={() => setShowWizard(!showWizard)} className="rounded-xl font-bold"><Sparkles className="mr-1 h-3 w-3" /> {showWizard ? "Hide Guide" : "Not Sure What You Need?"}</Button></div>
            <Card className="rounded-[24px] border-[#eab308]/20 bg-[#eab308]/5"><CardContent className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eab308]/20"><FileText className="h-5 w-5 text-[#eab308]" /></div><div><h3 className="text-sm font-black text-[#212529]">Digitize Documents</h3><p className="text-xs text-gray-400 font-medium">Upload scanned documents and convert them to editable digital formats</p></div></div><Link to="/digitize"><Button size="sm" className="rounded-xl font-bold bg-[#212529] text-white shadow-block"><ArrowRight className="mr-1 h-3 w-3" /> Start</Button></Link></CardContent></Card>
            <div className="grid gap-4 sm:grid-cols-2">{services.map(svc => (
              <Card key={svc.id} className="rounded-[24px] border-gray-100 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-black text-[#212529]">{svc.name}</h3>{svc.short_description && <p className="text-xs text-gray-400 font-medium mt-1">{svc.short_description}</p>}</div><Badge className="text-[10px] font-black uppercase tracking-wider rounded-lg bg-[#f8f9fa] text-gray-500 border-gray-200 shrink-0 ml-2">{svc.pricing_model === "custom" ? "Quote" : svc.price_from ? `$${svc.price_from}${svc.price_to && svc.price_to > svc.price_from ? `–$${svc.price_to}` : ""}` : "Contact"}</Badge></div>{svc.description && <p className="text-xs text-gray-400 font-medium mt-2 line-clamp-2">{svc.description}</p>}<div className="flex gap-2 mt-3"><Link to={getServiceUrl(svc)}><Button size="sm" className="text-xs rounded-xl font-bold bg-[#212529] text-white">{getServiceCTA(svc)}</Button></Link><Link to={`/services/${svc.id}`}><Button size="sm" variant="outline" className="text-xs rounded-xl font-bold">View Details</Button></Link></div></CardContent></Card>
            ))}</div>
            </div>
          )}

          {activeSection === "ai-tools" && (
            <PortalAIToolsTab />
          )}

          {activeSection === "referral" && (
            <ReferralPortal />
          )}

          {activeSection === "my-page" && (
            <PortalNotaryPageTab />
          )}

            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Document Wizard — rendered outside Tabs so it works from any tab */}
      {showWizard && (
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-sans flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Document Wizard</DialogTitle></DialogHeader>
            <DocumentWizard onSelectService={svc => { setShowWizard(false); navigate(`/book?service=${encodeURIComponent(svc)}`); }} onClose={() => setShowWizard(false)} />
          </DialogContent>
        </Dialog>
      )}

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

      <Dialog open={editProfileOpen} onOpenChange={(open) => {
        if (!open) {
          // Issue 3.14: Unsaved changes warning
          const hasChanges = profile && (
            profileForm.full_name !== (profile.full_name || "") ||
            profileForm.phone !== (profile.phone || "") ||
            profileForm.address !== (profile.address || "") ||
            profileForm.city !== (profile.city || "") ||
            profileForm.state !== (profile.state || "") ||
            profileForm.zip !== (profile.zip_code || "")
          );
          if (hasChanges && !open) {
            // Instead of window.confirm, just allow closing — the dialog has Cancel button
            // Profile form resets on next open anyway
          }
          if (!open && hasChanges) return; // prevent accidental close with changes
        }
        setEditProfileOpen(open);
      }}>
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
            <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Close My Account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your account, all appointments, documents, and data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { if (!user) return; try { const resp = await supabase.functions.invoke("delete-account"); if (resp.error) throw resp.error; toast({ title: "Account closed", description: "Your account and all data have been permanently deleted." }); signOut(); } catch (e: any) { toast({ title: "Error", description: e.message || "Failed to delete account. Please contact support.", variant: "destructive" }); } }}>Yes, close my account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm text-center"><DialogHeader><DialogTitle className="font-sans">Scan to Upload from Mobile</DialogTitle></DialogHeader><div className="flex justify-center py-4"><QRCodeSVG value={qrUrl} size={200} level="H" /></div><p className="text-sm text-muted-foreground">Scan this QR code with your phone camera to upload documents or join a notarization session directly from your mobile device.</p></DialogContent>
      </Dialog>

      <Dialog open={techCheckOpen} onOpenChange={setTechCheckOpen}>
        <DialogContent className="sm:max-w-md"><TechCheck onComplete={() => setTechCheckOpen(false)} /></DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
