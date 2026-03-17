import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, FileText, Users, History, Loader2, Plus, LogOut, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BusinessPortal() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [business, setBusiness] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({ business_name: "", ein: "", business_type: "", signers: "" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("business_profiles").select("*").eq("created_by", user.id).single(),
      supabase.from("documents").select("*").eq("uploaded_by", user.id).order("created_at", { ascending: false }),
    ]).then(([bizRes, docRes]) => {
      if (bizRes.data) setBusiness(bizRes.data);
      if (docRes.data) setDocuments(docRes.data);
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
                <TabsTrigger value="team"><Users className="mr-1 h-4 w-4" /> Team</TabsTrigger>
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

              <TabsContent value="team">
                <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
                  <p>Team management coming soon. Contact us to add team members.</p>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">
                  <History className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
                  <p>Monthly billing summaries and complete document history will appear here.</p>
                </CardContent></Card>
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
