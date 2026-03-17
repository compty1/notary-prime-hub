import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Monitor, Plus, LogOut, Shield, FileText, RefreshCw, Video, CheckCircle, Mic, Camera as CameraIcon, Wifi, XCircle, User, Pencil, Save, Loader2, Upload, Download, FolderOpen, QrCode, ArrowRight, MessageSquare, Send, Sparkles, Eye, DollarSign, Star, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import DocumentWizard from "@/components/DocumentWizard";

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

const docStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  notarized: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const pipelineSteps = [
  { key: "uploaded", label: "Intake", icon: Upload },
  { key: "pending_review", label: "Review", icon: FileText },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "notarized", label: "Notarized", icon: Shield },
];

const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export default function ClientPortal() {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [techCheckOpen, setTechCheckOpen] = useState(false);
  const [techResults, setTechResults] = useState<{ camera: boolean | null; mic: boolean | null; connection: boolean | null }>({ camera: null, mic: null, connection: null });
  const [techChecking, setTechChecking] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", address: "", city: "", state: "", zip: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Payments & Reviews
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ appointment_id: "", rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // AI explain
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainDialogOpen, setExplainDialogOpen] = useState(false);

  // Correspondence & Apostille
  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [apostilleRequests, setApostilleRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [apptRes, profileRes, docsRes, payRes, revRes, svcRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("documents").select("*").eq("uploaded_by", user.id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
        supabase.from("services").select("*").eq("is_active", true).order("display_order"),
      ]);
      if (apptRes.data) setAppointments(apptRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (revRes.data) setReviews(revRes.data);
      if (svcRes.data) setServices(svcRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({
          full_name: profileRes.data.full_name || "",
          phone: profileRes.data.phone || "",
          address: profileRes.data.address || "",
          city: profileRes.data.city || "",
          state: profileRes.data.state || "",
          zip: profileRes.data.zip || "",
        });
      }
      setLoading(false);
    };
    fetchData();

    // Load chat messages - own messages + admin replies addressed to this user
    supabase.from("chat_messages").select("*").or(`sender_id.eq.${user.id},and(is_admin.eq.true,recipient_id.eq.${user.id})`).order("created_at").then(({ data }) => {
      if (data) setChatMessages(data);
    });

    // Subscribe to new chat messages (admin replies)
    const chatChannel = supabase.channel("client-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || (msg.is_admin && msg.recipient_id === user.id)) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      })
      .subscribe();

    // Subscribe to appointment status changes in real-time
    const apptChannel = supabase.channel("client-appointments")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, (payload) => {
        const updated = payload.new as any;
        if (updated.client_id === user.id) {
          setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
          toast({ title: "Appointment updated", description: `Status: ${updated.status.replace(/_/g, " ")}` });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(chatChannel); supabase.removeChannel(apptChannel); };
  }, [user]);

  const upcoming = appointments.filter((a) => ["scheduled", "confirmed", "id_verification", "kba_pending"].includes(a.status));
  const inSession = appointments.filter((a) => a.status === "in_session");
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  const cancelAppointment = async (id: string) => {
    setCancelling(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelled" as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment cancelled" });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    }
    setCancelling(false);
    setCancelDialogId(null);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name, phone: profileForm.phone || null,
      address: profileForm.address || null, city: profileForm.city || null,
      state: profileForm.state || null, zip: profileForm.zip || null,
    }).eq("user_id", user.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Profile updated" }); setProfile({ ...profile, ...profileForm }); setEditProfileOpen(false); }
    setSavingProfile(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 20MB limit.`, variant: "destructive" });
        continue;
      }
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }
      const { data: docData, error: insertError } = await supabase.from("documents").insert({
        uploaded_by: user.id, file_name: file.name, file_path: filePath, status: "uploaded" as any,
      }).select().single();
      if (insertError) { toast({ title: "Error", description: insertError.message, variant: "destructive" }); }
      else if (docData) { setDocuments((prev) => [docData, ...prev]); }
    }
    toast({ title: "Documents uploaded", description: `${files.length} file(s) uploaded successfully.` });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadDocument = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
    if (error) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = doc.file_name; a.click();
    URL.revokeObjectURL(url);
  };

  const isSessionNear = (appt: any) => {
    const diff = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -60 * 60 * 1000;
  };

  const runTechCheck = async () => {
    setTechChecking(true);
    setTechResults({ camera: null, mic: null, connection: null });
    try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach((t) => t.stop()); setTechResults((p) => ({ ...p, camera: true })); } catch { setTechResults((p) => ({ ...p, camera: false })); }
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); setTechResults((p) => ({ ...p, mic: true })); } catch { setTechResults((p) => ({ ...p, mic: false })); }
    setTechResults((p) => ({ ...p, connection: navigator.onLine }));
    setTechChecking(false);
  };

  const getDocPipelineProgress = (status: string) => {
    const idx = pipelineSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? ((idx + 1) / pipelineSteps.length) * 100 : 0;
  };

  const qrUrl = `${window.location.origin}/portal`;

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !user) return;
    setSendingChat(true);
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id, message: chatInput.trim(), is_admin: false,
    });
    if (error) toast({ title: "Error sending message", variant: "destructive" });
    else setChatInput("");
    setSendingChat(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const explainDocument = async (doc: any) => {
    setExplaining(true);
    setExplanation(null);
    setExplainDialogOpen(true);
    try {
      const { data: fileData, error } = await supabase.storage.from("documents").download(doc.file_path);
      if (error) throw error;
      const text = await fileData.text();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ documentText: text, fileName: doc.file_name }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setExplanation(result.explanation + "\n\n" + result.disclaimer);
    } catch (e: any) {
      setExplanation("Could not analyze this document. " + (e.message || ""));
    }
    setExplaining(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Client Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && <Link to="/admin"><Button variant="outline" size="sm">Admin Dashboard</Button></Link>}
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
            <p className="text-muted-foreground">Manage your documents, appointments, and notarization status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)}><QrCode className="mr-1 h-3 w-3" /> Mobile Upload</Button>
            <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}><Pencil className="mr-1 h-3 w-3" /> Edit Profile</Button>
          </div>
        </motion.div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="appointments"><Calendar className="mr-1 h-4 w-4 hidden sm:inline" /> Appts</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-1 h-4 w-4 hidden sm:inline" /> Docs</TabsTrigger>
            <TabsTrigger value="status"><Shield className="mr-1 h-4 w-4 hidden sm:inline" /> Status</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="mr-1 h-4 w-4 hidden sm:inline" /> Chat</TabsTrigger>
            <TabsTrigger value="payments"><DollarSign className="mr-1 h-4 w-4 hidden sm:inline" /> Payments</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="mr-1 h-4 w-4 hidden sm:inline" /> Reviews</TabsTrigger>
            <TabsTrigger value="services"><ShoppingBag className="mr-1 h-4 w-4 hidden sm:inline" /> Services</TabsTrigger>
          </TabsList>

          {/* APPOINTMENTS TAB */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Upcoming Appointments</h2>
              <Link to="/book"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark"><Plus className="mr-1 h-4 w-4" /> New Appointment</Button></Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
            ) : upcoming.length === 0 && inSession.length === 0 ? (
              <Card className="border-border/50"><CardContent className="flex flex-col items-center py-12 text-center">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Link to="/book" className="mt-4"><Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Your First Appointment</Button></Link>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {inSession.map((appt) => (
                  <Card key={appt.id} className="border-2 border-purple-300 bg-purple-50/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><Video className="h-5 w-5 text-purple-600" /></div>
                        <div><p className="font-medium">{appt.service_type}</p><p className="text-sm text-muted-foreground">Session in progress</p></div>
                      </div>
                      <Link to={`/ron-session?id=${appt.id}`}><Button className="bg-purple-600 text-white hover:bg-purple-700"><Video className="mr-1 h-4 w-4" /> Rejoin</Button></Link>
                    </CardContent>
                  </Card>
                ))}
                {upcoming.map((appt) => (
                  <Card key={appt.id} className="border-border/50 transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                            {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-accent" /> : <MapPin className="h-5 w-5 text-accent" />}
                          </div>
                          <div>
                            <p className="font-medium">{appt.service_type}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(appt.scheduled_date)}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(appt.scheduled_time)}</span>
                            </div>
                            {appt.location && appt.location !== "Remote" && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {appt.location}</p>}
                            {appt.estimated_price && <p className="mt-1 text-xs text-muted-foreground">Est. ${parseFloat(appt.estimated_price).toFixed(2)}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {appt.notarization_type === "ron" && isSessionNear(appt) && <Link to={`/ron-session?id=${appt.id}`}><Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700"><Video className="mr-1 h-3 w-3" /> Join</Button></Link>}
                          {appt.notarization_type === "ron" && !isSessionNear(appt) && <Button size="sm" variant="outline" className="text-xs" onClick={() => { setTechCheckOpen(true); runTechCheck(); }}><Wifi className="mr-1 h-3 w-3" /> Tech Check</Button>}
                          <Link to={`/book?rebook=${appt.id}`}><Button size="sm" variant="outline" className="text-xs"><RefreshCw className="mr-1 h-3 w-3" /> Reschedule</Button></Link>
                          <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive" onClick={() => setCancelDialogId(appt.id)}>Cancel</Button>
                          <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>{appt.status.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {past.length > 0 && (
              <>
                <h2 className="mt-8 font-display text-xl font-semibold">Past Appointments</h2>
                <div className="space-y-3">
                  {past.map((appt) => (
                    <Card key={appt.id} className="border-border/50 opacity-75">
                      <CardContent className="flex items-center justify-between p-4">
                        <div><p className="font-medium">{appt.service_type}</p><p className="text-sm text-muted-foreground">{formatDate(appt.scheduled_date)}</p></div>
                        <div className="flex items-center gap-2">
                          {appt.status === "completed" && <Link to={`/book?rebook=${appt.id}`}><Button size="sm" variant="outline" className="text-xs"><RefreshCw className="mr-1 h-3 w-3" /> Rebook</Button></Link>}
                          <Badge className={statusColors[appt.status]}>{appt.status.replace(/_/g, " ")}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">My Documents</h2>
              <div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff" className="hidden" onChange={handleFileUpload} />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                  {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />} Upload Documents
                </Button>
              </div>
            </div>
            {documents.length === 0 ? (
              <Card className="border-border/50"><CardContent className="flex flex-col items-center py-12 text-center">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload your documents to get started with the notarization process</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="border-border/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                            {doc.appointment_id && <span className="ml-1 text-accent">• Linked to appointment</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={async () => {
                          const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        }} title="Preview"><Eye className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => explainDocument(doc)} title="AI Explain"><Sparkles className="h-3 w-3" /></Button>
                        {!doc.appointment_id && upcoming.length > 0 && (
                          <Select onValueChange={async (apptId) => {
                            const { error } = await supabase.from("documents").update({ appointment_id: apptId }).eq("id", doc.id);
                            if (error) toast({ title: "Error", variant: "destructive" });
                            else {
                              toast({ title: "Document linked to appointment" });
                              setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, appointment_id: apptId } : d));
                            }
                          }}>
                            <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue placeholder="Attach..." /></SelectTrigger>
                            <SelectContent>
                              {upcoming.map(a => (
                                <SelectItem key={a.id} value={a.id} className="text-xs">
                                  {a.service_type.substring(0, 20)} — {new Date(a.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Badge className={docStatusColors[doc.status] || "bg-muted text-muted-foreground"}>{doc.status.replace(/_/g, " ")}</Badge>
                        <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}><Download className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* STATUS TRACKER TAB */}
          <TabsContent value="status" className="space-y-6">
            <h2 className="font-display text-xl font-semibold">Document Status Pipeline</h2>
            {documents.length === 0 ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">Upload documents to track their progress through notarization.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <Badge className={docStatusColors[doc.status]}>{doc.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <Progress value={getDocPipelineProgress(doc.status)} className="mb-3 h-2" />
                      <div className="flex justify-between">
                        {pipelineSteps.map((step, i) => {
                          const currentIdx = pipelineSteps.findIndex((s) => s.key === doc.status);
                          const isComplete = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <div key={step.key} className="flex flex-col items-center text-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isComplete ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-accent ring-offset-2" : ""}`}>
                                <step.icon className="h-4 w-4" />
                              </div>
                              <span className={`mt-1 text-xs ${isComplete ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Live Chat</h2>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="h-80 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Send a message to get started!</p>
                  )}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${msg.is_admin ? "bg-muted text-foreground" : "bg-accent text-accent-foreground"}`}>
                        <p>{msg.message}</p>
                        <p className="mt-1 text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[40px] resize-none"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  />
                  <Button onClick={sendChatMessage} disabled={sendingChat || !chatInput.trim()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                    {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="font-display text-xl font-semibold">Payments & Invoices</h2>
            {payments.length === 0 ? (
              <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">
                <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p>No payment history yet</p>
                <p className="text-sm mt-1">Payments will appear here after your appointments are completed.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <Card key={p.id} className="border-border/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-sm">${parseFloat(p.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {p.method || "N/A"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={p.status === "paid" ? "bg-emerald-100 text-emerald-800" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}>
                          {p.status}
                        </Badge>
                        {p.invoice_url && <a href={p.invoice_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="text-xs">View Invoice</Button></a>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="space-y-6">
            <h2 className="font-display text-xl font-semibold">Leave a Review</h2>
            {past.filter(a => a.status === "completed").length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Select Appointment</Label>
                    <Select value={reviewForm.appointment_id} onValueChange={(v) => setReviewForm({ ...reviewForm, appointment_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose completed appointment..." /></SelectTrigger>
                      <SelectContent>
                        {past.filter(a => a.status === "completed" && !reviews.some(r => r.appointment_id === a.id)).map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.service_type} — {formatDate(a.scheduled_date)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="p-1">
                          <Star className={`h-6 w-6 ${n <= reviewForm.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Comment</Label>
                    <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Tell us about your experience..." />
                  </div>
                  <Button
                    disabled={!reviewForm.appointment_id || submittingReview}
                    onClick={async () => {
                      if (!user || !reviewForm.appointment_id) return;
                      setSubmittingReview(true);
                      const { error } = await supabase.from("reviews").insert({
                        client_id: user.id, appointment_id: reviewForm.appointment_id,
                        rating: reviewForm.rating, comment: reviewForm.comment || null,
                      });
                      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                      else {
                        toast({ title: "Review submitted! Thank you." });
                        setReviewForm({ appointment_id: "", rating: 5, comment: "" });
                        const { data: revs } = await supabase.from("reviews").select("*").eq("client_id", user.id);
                        if (revs) setReviews(revs);
                      }
                      setSubmittingReview(false);
                    }}
                    className="bg-accent text-accent-foreground hover:bg-gold-dark"
                  >
                    {submittingReview ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Star className="mr-1 h-4 w-4" />}
                    Submit Review
                  </Button>
                </CardContent>
              </Card>
            )}
            {reviews.length > 0 && (
              <>
                <h3 className="font-display text-lg font-semibold mt-6">Your Reviews</h3>
                <div className="space-y-3">
                  {reviews.map(r => (
                    <Card key={r.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />)}
                        </div>
                        {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Available Services</h2>
              <Button variant="outline" size="sm" onClick={() => setShowWizard(!showWizard)}>
                <Sparkles className="mr-1 h-3 w-3" /> {showWizard ? "Hide Guide" : "Not Sure What You Need?"}
              </Button>
            </div>
            {showWizard && (
              <DocumentWizard
                onSelectService={(svc) => { setShowWizard(false); }}
                onClose={() => setShowWizard(false)}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((svc) => (
                <Card key={svc.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{svc.name}</h3>
                        {svc.short_description && <p className="text-xs text-muted-foreground mt-1">{svc.short_description}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {svc.pricing_model === "custom" ? "Quote" :
                          svc.price_from ? `$${svc.price_from}${svc.price_to && svc.price_to > svc.price_from ? `–$${svc.price_to}` : ""}` : "Contact"}
                      </Badge>
                    </div>
                    {svc.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{svc.description}</p>}
                    <div className="flex gap-2 mt-3">
                      <Link to={`/book?type=${svc.name.toLowerCase().includes("remote") ? "ron" : "in_person"}`}>
                        <Button size="sm" className="text-xs bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Explain Dialog */}
      <Dialog open={explainDialogOpen} onOpenChange={setExplainDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> AI Document Explanation</DialogTitle></DialogHeader>
          {explaining ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Analyzing document...</p>
            </div>
          ) : explanation ? (
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm">{explanation}</div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialogId} onOpenChange={() => setCancelDialogId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Appointment</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogId(null)}>Keep</Button>
            <Button variant="destructive" onClick={() => cancelDialogId && cancelAppointment(cancelDialogId)} disabled={cancelling}>{cancelling ? "Cancelling..." : "Cancel Appointment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><User className="h-5 w-5 text-accent" /> Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(614) 555-1234" /></div>
            <div><Label>Address</Label><Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>City</Label><Input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} maxLength={2} /></div>
              <div><Label>Zip</Label><Input value={profileForm.zip} onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })} maxLength={5} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              {savingProfile ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle className="font-display">Scan to Upload from Mobile</DialogTitle></DialogHeader>
          <div className="flex justify-center py-4">
            <QRCodeSVG value={qrUrl} size={200} level="H" />
          </div>
          <p className="text-sm text-muted-foreground">Scan this QR code with your phone to open the portal, upload documents, verify your ID, or join a session.</p>
        </DialogContent>
      </Dialog>

      {/* Tech Check Dialog */}
      <Dialog open={techCheckOpen} onOpenChange={setTechCheckOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">RON Tech Check</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { label: "Camera", result: techResults.camera, icon: CameraIcon },
              { label: "Microphone", result: techResults.mic, icon: Mic },
              { label: "Internet", result: techResults.connection, icon: Wifi },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2"><item.icon className="h-5 w-5 text-muted-foreground" /><span>{item.label}</span></div>
                {techChecking && item.result === null ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
                  item.result ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : item.result === false ? <XCircle className="h-5 w-5 text-destructive" /> : null}
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setTechCheckOpen(false); }}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
