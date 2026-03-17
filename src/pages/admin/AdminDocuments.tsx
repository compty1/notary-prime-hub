import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Loader2, ShieldCheck, ShieldX, ExternalLink, Eye, Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2 } from "lucide-react";

const docStatuses = ["uploaded", "pending_review", "approved", "notarized", "rejected"];

const docStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  notarized: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 20;

const AdminDocuments = React.forwardRef<HTMLDivElement>(function AdminDocuments(_, ref) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verificationByDoc, setVerificationByDoc] = useState<Record<string, any>>({});
  const [sealingId, setSealingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Search, filter, sort, pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [page, setPage] = useState(0);

  const fetchDocs = async () => {
    const [docsRes, verificationsRes, profilesRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("e_seal_verifications" as any).select("*"),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);

    if (docsRes.data) setDocs(docsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (verificationsRes.data) {
      const mapped: Record<string, any> = {};
      (verificationsRes.data as any[]).forEach((v: any) => { mapped[v.document_id] = v; });
      setVerificationByDoc(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const getUploaderName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  // Filter + search + sort
  const filtered = docs.filter((doc) => {
    if (statusFilter !== "all" && doc.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const uploaderName = getUploaderName(doc.uploaded_by).toLowerCase();
      if (!doc.file_name.toLowerCase().includes(term) && !uploaderName.includes(term)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.file_name.localeCompare(b.file_name);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("documents").update({ status: newStatus as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document status updated", description: `→ ${newStatus.replace(/_/g, " ")}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id, action: "document_status_changed", entity_type: "document", entity_id: id, details: { new_status: newStatus },
      });
      fetchDocs();
    }
    setUpdatingId(null);
  };

  const generateVerification = async (doc: any) => {
    if (!user) return;
    setSealingId(doc.id);
    try {
      let signerName: string | null = null;
      if (doc.appointment_id) {
        const { data: appt } = await supabase.from("appointments").select("client_id").eq("id", doc.appointment_id).maybeSingle();
        if (appt?.client_id) {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", appt.client_id).maybeSingle();
          signerName = profile?.full_name || null;
        }
      }
      const response = await supabase.from("e_seal_verifications" as any).insert({
        document_id: doc.id, appointment_id: doc.appointment_id || null, document_name: doc.file_name,
        signer_name: signerName, notarized_at: new Date().toISOString(), created_by: user.id, status: "valid",
      }).select("*").single();
      const data = response.data as any;
      const error = response.error as any;
      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast({ title: "Verification already exists" });
        } else throw error;
      } else {
        setVerificationByDoc((prev) => ({ ...prev, [doc.id]: data }));
        await supabase.from("audit_log").insert({ user_id: user.id, action: "verification_created", entity_type: "e_seal_verification", entity_id: data?.id, details: { document_id: doc.id } });
        toast({ title: "Verification published" });
      }
    } catch (error: any) {
      toast({ title: "Verification error", description: error.message, variant: "destructive" });
    }
    setSealingId(null);
  };

  const revokeVerification = async (docId: string, verificationId: string) => {
    setSealingId(docId);
    const { error } = await supabase.from("e_seal_verifications" as any).update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", verificationId);
    if (error) toast({ title: "Revoke failed", description: error.message, variant: "destructive" });
    else {
      setVerificationByDoc((prev) => ({ ...prev, [docId]: { ...prev[docId], status: "revoked" } }));
      await supabase.from("audit_log").insert({ user_id: user?.id, action: "verification_revoked", entity_type: "e_seal_verification", entity_id: verificationId });
      toast({ title: "Verification revoked" });
    }
    setSealingId(null);
  };

  const downloadDocument = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
    if (error) { toast({ title: "Download failed", description: error.message, variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click(); URL.revokeObjectURL(url);
  };

  const openPreview = async (doc: any) => {
    setPreviewDoc(doc);
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
    setPreviewUrl(data?.signedUrl || null);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div ref={ref}>
      <h1 className="mb-4 font-display text-2xl font-bold text-foreground">Document Management</h1>

      {/* Search, Filter, Sort */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by filename or client..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {docStatuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-36"><ArrowUpDown className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>

      {paginated.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No documents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginated.map((doc) => {
            const verification = verificationByDoc[doc.id];
            const hasActiveVerification = verification && verification.status === "valid";
            return (
              <Card key={doc.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate" title={doc.file_name}>{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{getUploaderName(doc.uploaded_by)}</span>
                        {" · "}{new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {doc.appointment_id && <span className="ml-2">• Linked</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => openPreview(doc)}><Eye className="mr-1 h-3 w-3" /> Preview</Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => downloadDocument(doc)}><Download className="mr-1 h-3 w-3" /> Download</Button>
                    {doc.status === "notarized" && !verification && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => generateVerification(doc)} disabled={sealingId === doc.id}>
                        {sealingId === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />} Publish Verify
                      </Button>
                    )}
                    {hasActiveVerification && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open(`/verify/${verification.id}`, "_blank")}><ExternalLink className="mr-1 h-3 w-3" /> Verify</Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={() => revokeVerification(doc.id, verification.id)} disabled={sealingId === doc.id}><ShieldX className="mr-1 h-3 w-3" /> Revoke</Button>
                      </>
                    )}
                    <Select value={doc.status} onValueChange={(v) => updateStatus(doc.id, v)}>
                      <SelectTrigger className="w-36"><Badge className={docStatusColors[doc.status] || "bg-muted"}>{doc.status.replace(/_/g, " ")}</Badge></SelectTrigger>
                      <SelectContent>{docStatuses.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
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

      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader><DialogTitle className="font-display">{previewDoc?.file_name}</DialogTitle></DialogHeader>
          {previewUrl ? (
            previewDoc?.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewUrl} alt={previewDoc.file_name} className="max-h-[65vh] w-full object-contain rounded" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[65vh] rounded border border-border" title="Document Preview" />
            )
          ) : (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default AdminDocuments;
