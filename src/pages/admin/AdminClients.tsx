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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Phone, Calendar, Star, MapPin, Monitor, Mail, Download, Save, Loader2, ChevronLeft, ChevronRight, Send, Upload, UserPlus, Pencil } from "lucide-react";

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
  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", address: "", city: "", state: "", zip: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  // Create profile state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", phone: "", address: "", city: "", state: "OH", zip: "" });
  const [creating, setCreating] = useState(false);
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

  const fetchData = async () => {
    const [profileRes, apptRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }),
    ]);
    if (profileRes.data) {
      setProfiles(profileRes.data);
      // Load avatar URLs for profiles with avatar_path
      const withAvatars = profileRes.data.filter((p: any) => p.avatar_path);
      if (withAvatars.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(withAvatars.map(async (p: any) => {
          const { data } = await supabase.storage.from("documents").createSignedUrl(p.avatar_path, 3600);
          if (data?.signedUrl) urls[p.user_id] = data.signedUrl;
        }));
        setAvatarUrls(urls);
      }
    }
    if (apptRes.data) setAppointments(apptRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
    setEditMode(false);
    setEditForm({ full_name: p.full_name || "", phone: p.phone || "", email: p.email || "", address: p.address || "", city: p.city || "", state: p.state || "", zip: p.zip || "" });
  };

  const saveProfile = async () => {
    if (!selectedClient || !user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      address: editForm.address || null,
      city: editForm.city || null,
      state: editForm.state || null,
      zip: editForm.zip || null,
      admin_notes: adminNotes || null,
    } as any).eq("user_id", selectedClient.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      const updated = { ...selectedClient, ...editForm, admin_notes: adminNotes };
      setProfiles((prev) => prev.map((p) => p.user_id === selectedClient.user_id ? { ...p, ...editForm, admin_notes: adminNotes } : p));
      setSelectedClient(updated);
      setEditMode(false);
      await supabase.from("audit_log").insert({
        user_id: user.id, action: "client_profile_updated", entity_type: "profile",
        entity_id: selectedClient.user_id, details: { fields: Object.keys(editForm) },
      });
    }
    setSavingProfile(false);
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
    }
    setSavingNotes(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `profiles/${selectedClient.user_id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    await supabase.from("profiles").update({ avatar_path: path } as any).eq("user_id", selectedClient.user_id);
    const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    if (urlData?.signedUrl) {
      setAvatarUrls((prev) => ({ ...prev, [selectedClient.user_id]: urlData.signedUrl }));
    }
    setProfiles((prev) => prev.map((p) => p.user_id === selectedClient.user_id ? { ...p, avatar_path: path } : p));
    setSelectedClient({ ...selectedClient, avatar_path: path });
    toast({ title: "Avatar uploaded" });
    setUploadingAvatar(false);
  };

  const createProfile = async () => {
    if (!createForm.full_name.trim() && !createForm.email.trim()) return;
    setCreating(true);
    const placeholderId = crypto.randomUUID();
    const { error } = await supabase.from("profiles").insert({
      user_id: placeholderId,
      full_name: createForm.full_name || null,
      email: createForm.email || null,
      phone: createForm.phone || null,
      address: createForm.address || null,
      city: createForm.city || null,
      state: createForm.state || "OH",
      zip: createForm.zip || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile created", description: "This profile will link when the user signs up with that email." });
      setShowCreate(false);
      setCreateForm({ full_name: "", email: "", phone: "", address: "", city: "", state: "OH", zip: "" });
      fetchData();
    }
    setCreating(false);
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="mr-1 h-3 w-3" /> Create Profile
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="mr-1 h-3 w-3" /> Export CSV
          </Button>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, phone, or address..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>

      {loading ? (
        <CardListSkeleton count={6} />
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
                    <Avatar className="h-10 w-10">
                      {avatarUrls[p.user_id] ? (
                        <AvatarImage src={avatarUrls[p.user_id]} alt={p.full_name || "Avatar"} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                        {(p.full_name || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                        {stats.isRepeat && <Badge className="bg-primary/20 text-primary-foreground text-xs flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> Repeat</Badge>}
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

      {/* Client Detail / Edit Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center justify-between">
              {selectedClient?.full_name || "Client Details"}
              <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>
                <Pencil className="mr-1 h-3 w-3" /> {editMode ? "Cancel" : "Edit"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (() => {
            const stats = getClientStats(selectedClient.user_id);
            return (
              <div className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {avatarUrls[selectedClient.user_id] ? (
                      <AvatarImage src={avatarUrls[selectedClient.user_id]} alt={selectedClient.full_name || "Avatar"} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                      {(selectedClient.full_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Upload className="h-3 w-3" /> {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                    </Label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </div>
                </div>

                {editMode ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Full Name</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
                      <div><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                      <div><Label className="text-xs">Address</Label><Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">City</Label><Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
                      <div><Label className="text-xs">State</Label><Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} /></div>
                      <div><Label className="text-xs">Zip</Label><Input value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} /></div>
                    </div>
                    <div>
                      <Label className="text-xs">Admin Notes</Label>
                      <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Internal notes..." />
                    </div>
                    <Button onClick={saveProfile} disabled={savingProfile} className="bg-gradient-primary text-white hover:opacity-90">
                      {savingProfile ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save All Changes
                    </Button>
                  </div>
                ) : (
                  <>
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
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={saveAdminNotes} disabled={savingNotes} className="bg-gradient-primary text-white hover:opacity-90">
                          {savingNotes ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save Notes
                        </Button>
                        {selectedClient.email && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setMessageClient(selectedClient);
                            setMessageSubject("Message from Notar");
                            setMessageBody("");
                          }}>
                            <Mail className="mr-1 h-3 w-3" /> Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Appointment History</h4>
                  {stats.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No appointments</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {stats.appointments.map((appt: any) => (
                        <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            {appt.notarization_type === "ron" ? <Monitor className="h-3 w-3 text-primary" /> : <MapPin className="h-3 w-3 text-primary" />}
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

      {/* Create Profile Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Create Client Profile</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Pre-create a profile. It will link automatically when the user signs up with the same email.</p>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name</Label><Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Phone</Label><Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Address</Label><Input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">City</Label><Input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} /></div>
              <div><Label className="text-xs">State</Label><Input value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} /></div>
              <div><Label className="text-xs">Zip</Label><Input value={createForm.zip} onChange={(e) => setCreateForm({ ...createForm, zip: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createProfile} disabled={creating || (!createForm.full_name.trim() && !createForm.email.trim())} className="bg-gradient-primary text-white hover:opacity-90">
              {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Client Dialog */}
      <Dialog open={!!messageClient} onOpenChange={() => setMessageClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Message Client</DialogTitle></DialogHeader>
          {messageClient && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p><strong>To:</strong> {messageClient.full_name || "Client"} ({messageClient.email})</p>
              </div>
              <div><Label>Subject</Label><Input value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} /></div>
              <div><Label>Message</Label><Textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} rows={5} placeholder="Type your message..." /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageClient(null)}>Cancel</Button>
            <Button onClick={sendClientMessage} disabled={sendingMessage || !messageBody.trim()} className="bg-gradient-primary text-white hover:opacity-90">
              {sendingMessage ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
