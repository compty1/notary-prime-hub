import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Shield, Clock, CheckCircle, XCircle, Loader2, Trash2, Upload, Save, Pencil, Award, Plus, X } from "lucide-react";

interface Certification {
  id?: string;
  user_id: string;
  certification_name: string;
  issuing_body: string;
  certification_number: string;
  issued_date: string;
  expiry_date: string;
  file_path: string;
  _isNew?: boolean;
  _deleted?: boolean;
}

export default function AdminTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [notaries, setNotaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  // Detail dialog
  const [selectedNotary, setSelectedNotary] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", address: "", city: "", state: "", zip: "" });
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchData = async () => {
    const [{ data: inviteData }, { data: roleData }] = await Promise.all([
      supabase.from("notary_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "notary" as any),
    ]);
    if (inviteData) setInvites(inviteData);
    if (roleData && roleData.length > 0) {
      const userIds = roleData.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      setNotaries(profiles || []);
      // Load avatars
      const withAvatars = (profiles || []).filter((p: any) => p.avatar_path);
      if (withAvatars.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(withAvatars.map(async (p: any) => {
          const { data } = await supabase.storage.from("documents").createSignedUrl(p.avatar_path, 3600);
          if (data?.signedUrl) urls[p.user_id] = data.signedUrl;
        }));
        setAvatarUrls(urls);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNotary = async (n: any) => {
    setSelectedNotary(n);
    setEditForm({ full_name: n.full_name || "", phone: n.phone || "", email: n.email || "", address: n.address || "", city: n.city || "", state: n.state || "", zip: n.zip || "" });
    // Fetch certifications
    const { data } = await supabase.from("notary_certifications").select("*").eq("user_id", n.user_id).order("created_at", { ascending: true });
    setCertifications((data || []).map((c: any) => ({ ...c, _isNew: false, _deleted: false })));
  };

  const saveNotary = async () => {
    if (!selectedNotary || !user) return;
    setSaving(true);
    // Update profile
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      address: editForm.address || null,
      city: editForm.city || null,
      state: editForm.state || null,
      zip: editForm.zip || null,
    } as any).eq("user_id", selectedNotary.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    // Handle certifications
    const toDelete = certifications.filter((c) => c._deleted && c.id);
    const toInsert = certifications.filter((c) => c._isNew && !c._deleted);
    const toUpdate = certifications.filter((c) => !c._isNew && !c._deleted && c.id);
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((c) => supabase.from("notary_certifications").delete().eq("id", c.id!)));
    }
    if (toInsert.length > 0) {
      await supabase.from("notary_certifications").insert(toInsert.map((c) => ({
        user_id: selectedNotary.user_id,
        certification_name: c.certification_name,
        issuing_body: c.issuing_body || null,
        certification_number: c.certification_number || null,
        issued_date: c.issued_date || null,
        expiry_date: c.expiry_date || null,
      })));
    }
    if (toUpdate.length > 0) {
      await Promise.all(toUpdate.map((c) => supabase.from("notary_certifications").update({
        certification_name: c.certification_name,
        issuing_body: c.issuing_body || null,
        certification_number: c.certification_number || null,
        issued_date: c.issued_date || null,
        expiry_date: c.expiry_date || null,
      }).eq("id", c.id!)));
    }
    toast({ title: "Notary profile updated" });
    setNotaries((prev) => prev.map((p) => p.user_id === selectedNotary.user_id ? { ...p, ...editForm } : p));
    setSelectedNotary(null);
    setSaving(false);
    fetchData();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNotary) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `profiles/${selectedNotary.user_id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    await supabase.from("profiles").update({ avatar_path: path } as any).eq("user_id", selectedNotary.user_id);
    const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    if (urlData?.signedUrl) setAvatarUrls((prev) => ({ ...prev, [selectedNotary.user_id]: urlData.signedUrl }));
    toast({ title: "Avatar uploaded" });
    setUploadingAvatar(false);
  };

  const addCertification = () => {
    setCertifications((prev) => [...prev, {
      user_id: selectedNotary?.user_id || "",
      certification_name: "",
      issuing_body: "",
      certification_number: "",
      issued_date: "",
      expiry_date: "",
      file_path: "",
      _isNew: true,
      _deleted: false,
    }]);
  };

  const updateCert = (idx: number, field: string, value: string) => {
    setCertifications((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const removeCert = (idx: number) => {
    setCertifications((prev) => prev.map((c, i) => i === idx ? { ...c, _deleted: true } : c));
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSending(true);
    const existing = invites.find((i) => i.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existing) {
      toast({ title: "Already invited", description: `${inviteEmail} has already been invited.`, variant: "destructive" });
      setSending(false);
      return;
    }
    const { error } = await supabase.from("notary_invites").insert({
      email: inviteEmail.trim().toLowerCase(),
      invited_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite sent", description: `${inviteEmail} will be assigned the notary role when they sign up.` });
      setInviteEmail("");
      await supabase.from("audit_log").insert({
        user_id: user.id, action: "notary_invited", entity_type: "notary_invite",
        details: { email: inviteEmail },
      });
      fetchData();
    }
    setSending(false);
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("notary_invites").delete().eq("id", id);
    toast({ title: "Invite revoked" });
    fetchData();
  };

  const removeNotaryRole = async (userId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "notary" as any);
    toast({ title: "Notary role removed" });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold text-foreground">Team & Notary Invites</h1>
        <p className="text-sm text-muted-foreground">Invite other notaries to join your platform with limited access</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-sans text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Invite a Notary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invited notaries can view appointments, manage their own journal entries, and access resources. They cannot change platform settings, manage clients, or view revenue.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Email Address</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="notary@example.com" onKeyDown={(e) => e.key === "Enter" && sendInvite()} />
              </div>
              <div className="flex items-end">
                <Button onClick={sendInvite} disabled={sending || !inviteEmail.trim()} className="bg-gradient-primary text-white hover:opacity-90">
                  {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />} Invite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Notaries */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-sans text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Active Notaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notaries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notaries have joined yet</p>
            ) : (
              <div className="space-y-3">
                {notaries.map((n) => (
                  <div key={n.user_id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openNotary(n)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {avatarUrls[n.user_id] ? <AvatarImage src={avatarUrls[n.user_id]} alt={n.full_name || "Avatar"} /> : null}
                        <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                          {(n.full_name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{n.full_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{n.email || n.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary text-xs">
                        <Shield className="mr-1 h-3 w-3" /> Notary
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeNotaryRole(n.user_id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Invite History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invites sent yet</p>
            ) : (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-3">
                      {inv.status === "pending" ? <Clock className="h-4 w-4 text-amber-500" /> : inv.status === "accepted" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {new Date(inv.created_at).toLocaleDateString()}
                          {inv.accepted_at && ` • Accepted ${new Date(inv.accepted_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={inv.status === "accepted" ? "default" : "secondary"} className="text-xs">{inv.status}</Badge>
                      {inv.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => revokeInvite(inv.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notary Detail / Edit Dialog */}
      <Dialog open={!!selectedNotary} onOpenChange={() => setSelectedNotary(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Edit Notary Profile
            </DialogTitle>
          </DialogHeader>
          {selectedNotary && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {avatarUrls[selectedNotary.user_id] ? <AvatarImage src={avatarUrls[selectedNotary.user_id]} alt="Avatar" /> : null}
                  <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                    {(selectedNotary.full_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="notary-avatar" className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Upload className="h-3 w-3" /> {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </Label>
                  <input id="notary-avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </div>
              </div>

              {/* Profile Fields */}
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
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1"><Award className="h-4 w-4 text-primary" /> Certifications</h4>
                  <Button size="sm" variant="outline" onClick={addCertification}><Plus className="mr-1 h-3 w-3" /> Add</Button>
                </div>
                <div className="space-y-3">
                  {certifications.filter((c) => !c._deleted).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No certifications added yet</p>
                  ) : (
                    certifications.filter((c) => !c._deleted).map((cert, idx) => {
                      const realIdx = certifications.findIndex((c) => c === cert);
                      return (
                        <div key={realIdx} className="rounded-lg border border-border/50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Input placeholder="Certification name (e.g. NNA Certified NSA)" value={cert.certification_name} onChange={(e) => updateCert(realIdx, "certification_name", e.target.value)} className="text-sm" />
                            <Button size="sm" variant="ghost" className="ml-2 text-destructive" onClick={() => removeCert(realIdx)}><X className="h-3 w-3" /></Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Issuing body" value={cert.issuing_body} onChange={(e) => updateCert(realIdx, "issuing_body", e.target.value)} className="text-xs" />
                            <Input placeholder="Cert #" value={cert.certification_number} onChange={(e) => updateCert(realIdx, "certification_number", e.target.value)} className="text-xs" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label className="text-xs">Issued</Label><Input type="date" value={cert.issued_date} onChange={(e) => updateCert(realIdx, "issued_date", e.target.value)} className="text-xs" /></div>
                            <div><Label className="text-xs">Expires</Label><Input type="date" value={cert.expiry_date} onChange={(e) => updateCert(realIdx, "expiry_date", e.target.value)} className="text-xs" /></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNotary(null)}>Cancel</Button>
            <Button onClick={saveNotary} disabled={saving} className="bg-gradient-primary text-white hover:opacity-90">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
