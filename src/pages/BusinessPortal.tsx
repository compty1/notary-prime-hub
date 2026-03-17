import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, FileText, Users, History, Loader2, Plus, LogOut, ChevronLeft, Trash2, DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function BusinessPortal() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [business, setBusiness] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [form, setForm] = useState({ business_name: "", ein: "", business_type: "", signers: "" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("business_profiles").select("*").eq("created_by", user.id).single(),
      supabase.from("documents").select("*").eq("uploaded_by", user.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }),
      supabase.from("payments").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
    ]).then(([bizRes, docRes, apptRes, payRes]) => {
      if (bizRes.data) {
        setBusiness(bizRes.data);
        // Load team members
        supabase.from("business_members").select("*").eq("business_id", bizRes.data.id).then(({ data }) => {
          if (data) setMembers(data);
        });
      }
      if (docRes.data) setDocuments(docRes.data);
      if (apptRes.data) setAppointments(apptRes.data);
      if (payRes.data) setPayments(payRes.data);
      setLoading(false);
    });
  }, [user]);

  const registerBusiness = async () => {
    if (!user) return;
    const signers = form.signers.split(",").map((s) => s.trim()).filter(Boolean);
    const { data, error } = await supabase.from("business_profiles").insert({
      business_name: form.business_name, ein: form.ein || null, business_type: form.business_type || null,
      authorized_signers: signers as any, created_by: user.id,
    } as any).select().single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setBusiness(data); setRegisterOpen(false); toast({ title: "Business registered!" }); }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      if (file.size > 20 * 1024 * 1024) continue;
      const filePath = `${user.id}/business/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(filePath, file);
      if (!upErr) {
        const { data } = await supabase.from("documents").insert({ uploaded_by: user.id, file_name: file.name, file_path: filePath, status: "uploaded" as any }).select().single();
        if (data) setDocuments((prev) => [data, ...prev]);
      }
    }
    toast({ title: "Documents uploaded" });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTeamMember = async () => {
    if (!inviteEmail.trim() || !business) return;
    // Look up user by email in profiles
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", inviteEmail.trim()).single();
    if (!profile) {
      toast({ title: "User not found", description: "No account found with that email. They must sign up first.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("business_members").insert({
      business_id: business.id, user_id: profile.user_id, member_role: "member",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team member added" });
      setInviteEmail("");
      const { data } = await supabase.from("business_members").select("*").eq("business_id", business.id);
      if (data) setMembers(data);
    }
  };

  const removeMember = async (memberId: string) => {
    await supabase.from("business_members").delete().eq("id", memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast({ title: "Member removed" });
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><span className="font-display text-lg font-bold text-primary-foreground">SG</span></div>
            <span className="font-display text-lg font-bold text-foreground">Business Portal</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/portal"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Client Portal</Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {!business ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h1 className="font-display text-2xl font-bold mb-2">Business Client Portal</h1>
            <p className="text-muted-foreground mb-6">Register your business for bulk uploads, team accounts, and dedicated service</p>
            <Button onClick={() => setRegisterOpen(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark"><Plus className="mr-1 h-4 w-4" /> Register Business</Button>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="h-6 w-6 text-accent" />
                <h1 className="font-display text-2xl font-bold">{business.business_name}</h1>
                <Badge className={business.verification_status === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}>
                  {business.verification_status}
                </Badge>
              </div>
              {business.ein && <p className="text-sm text-muted-foreground">EIN: {business.ein}</p>}
            </div>

            <Tabs defaultValue="documents" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="documents"><FileText className="mr-1 h-4 w-4" /> Documents</TabsTrigger>
                <TabsTrigger value="team"><Users className="mr-1 h-4 w-4" /> Team ({members.length})</TabsTrigger>
                <TabsTrigger value="history"><History className="mr-1 h-4 w-4" /> History</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Bulk Document Upload</h2>
                  <div>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleBulkUpload} />
                    <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                      {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />} Upload Files
                    </Button>
                  </div>
                </div>
                {documents.map((doc) => (
                  <Card key={doc.id} className="border-border/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{doc.status.replace(/_/g, " ")}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Team Members</h2>
                <div className="flex gap-2">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter team member's email..." className="max-w-sm" />
                  <Button size="sm" onClick={addTeamMember} disabled={!inviteEmail.trim()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                    <Plus className="mr-1 h-4 w-4" /> Add Member
                  </Button>
                </div>
                {members.length === 0 ? (
                  <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
                    <p>No team members yet. Add members by email above.</p>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <Card key={m.id} className="border-border/50">
                        <CardContent className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium">{m.user_id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground capitalize">{m.member_role}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Billing & Appointment History</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="mx-auto mb-1 h-5 w-5 text-accent" />
                      <p className="text-xl font-bold text-foreground">${totalPaid.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="mx-auto mb-1 h-5 w-5 text-amber-500" />
                      <p className="text-xl font-bold text-foreground">${totalPending.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </CardContent>
                  </Card>
                </div>
                {appointments.length === 0 ? (
                  <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">
                    <Calendar className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
                    <p>No appointment history yet.</p>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 20).map((a) => (
                      <Card key={a.id} className="border-border/50">
                        <CardContent className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium">{a.service_type}</p>
                            <p className="text-xs text-muted-foreground">{new Date(a.scheduled_date + "T00:00:00").toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.estimated_price && <span className="text-sm font-medium">${parseFloat(a.estimated_price).toFixed(2)}</span>}
                            <Badge variant="outline" className="text-xs">{a.status.replace(/_/g, " ")}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Register Your Business</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Business Name *</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
            <div><Label>EIN (optional)</Label><Input value={form.ein} onChange={(e) => setForm({ ...form, ein: e.target.value })} placeholder="XX-XXXXXXX" /></div>
            <div><Label>Business Type</Label><Input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} placeholder="e.g., Law Firm, Dealership, Hospital" /></div>
            <div><Label>Authorized Signers (comma-separated)</Label><Input value={form.signers} onChange={(e) => setForm({ ...form, signers: e.target.value })} placeholder="John Smith, Jane Doe" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button onClick={registerBusiness} disabled={!form.business_name} className="bg-accent text-accent-foreground hover:bg-gold-dark">Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
