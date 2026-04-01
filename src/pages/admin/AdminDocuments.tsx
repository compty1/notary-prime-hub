import { usePageTitle } from "@/lib/usePageTitle";
import React, { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Loader2, ShieldCheck, ShieldX, ExternalLink, Eye, Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Send, Upload, Image, Tag, Plus, X } from "lucide-react";
import { TableSkeleton } from "@/components/AdminLoadingSkeleton";

const docStatuses = ["uploaded", "pending_review", "approved", "notarized", "rejected"];

import { documentStatusColors as docStatusColors } from "@/lib/statusColors";

const PAGE_SIZE = 20;

const isImageFile = (fileName: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
const isPdfFile = (fileName: string) => /\.pdf$/i.test(fileName);

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  // Upload dialog
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClientId, setUploadClientId] = useState("");
  const [uploading, setUploading] = useState(false);

  // Search, filter, sort, pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [page, setPage] = useState(0);

  // Document tags
  const [tagsByDoc, setTagsByDoc] = useState<Record<string, string[]>>({});
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [tagFilter, setTagFilter] = useState("");

  const fetchTags = async () => {
    const { data } = await supabase.from("document_tags").select("document_id, tag");
    if (data) {
      const mapped: Record<string, string[]> = {};
      data.forEach((t: any) => {
        if (!mapped[t.document_id]) mapped[t.document_id] = [];
        mapped[t.document_id].push(t.tag);
      });
      setTagsByDoc(mapped);
    }
  };

  const addTag = async (docId: string) => {
    const tag = (tagInput[docId] || "").trim().toLowerCase();
    if (!tag) return;
    const { error } = await supabase.from("document_tags").insert({ document_id: docId, tag });
    if (error) {
      if (error.code === "23505") toast({ title: "Tag already exists" });
      else toast({ title: "Failed to add tag", variant: "destructive" });
    } else {
      setTagsByDoc(prev => ({ ...prev, [docId]: [...(prev[docId] || []), tag] }));
      setTagInput(prev => ({ ...prev, [docId]: "" }));
    }
  };

  const removeTag = async (docId: string, tag: string) => {
    await supabase.from("document_tags").delete().eq("document_id", docId).eq("tag", tag);
    setTagsByDoc(prev => ({ ...prev, [docId]: (prev[docId] || []).filter(t => t !== tag) }));
  };

  const allTags = Array.from(new Set(Object.values(tagsByDoc).flat())).sort();

  const fetchDocs = async () => {
    const [docsRes, verificationsRes, profilesRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("e_seal_verifications" as any).select("*"),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);

    if (docsRes.data) {
      setDocs(docsRes.data);
      const imageFiles = docsRes.data.filter((d: any) => isImageFile(d.file_name));
      if (imageFiles.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(imageFiles.slice(0, 50).map(async (d: any) => {
          const { data } = await supabase.storage.from("documents").createSignedUrl(d.file_path, 3600);
          if (data?.signedUrl) urls[d.id] = data.signedUrl;
        }));
        setThumbnailUrls(urls);
      }
    }
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (verificationsRes.data) {
      const mapped: Record<string, any> = {};
      (verificationsRes.data as any[]).forEach((v: any) => { mapped[v.document_id] = v; });
      setVerificationByDoc(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); fetchTags(); }, []);

  const getUploaderName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  // Filter + search + sort
  const filtered = docs.filter((doc) => {
    if (statusFilter !== "all" && doc.status !== statusFilter) return false;
    if (tagFilter && !(tagsByDoc[doc.id] || []).includes(tagFilter)) return false;
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

  const handleUpload = async () => {
    if (!uploadFile || !user) return;
    setUploading(true);
    try {
      const clientId = (!uploadClientId || uploadClientId === "__self__") ? user.id : uploadClientId;
      const ext = uploadFile.name.split(".").pop();
      const path = `${clientId}/${Date.now()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, uploadFile);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("documents").insert({
        file_name: uploadFile.name,
        file_path: path,
        uploaded_by: clientId,
        status: "uploaded" as any,
      });
      if (insertError) throw insertError;

      await supabase.from("audit_log").insert({
        user_id: user.id, action: "admin_document_upload", entity_type: "document",
        details: { file_name: uploadFile.name, client_id: clientId },
      });

      toast({ title: "Document uploaded successfully" });
      setShowUpload(false);
      setUploadFile(null);
      setUploadClientId("");
      fetchDocs();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
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
    if (user) {
      supabase.from("audit_log").insert({
        user_id: user.id, action: "admin_document_download", entity_type: "document",
        entity_id: doc.id, details: { file_name: doc.file_name, uploader: doc.uploaded_by },
      }).then(() => {});
    }
  };

  const sendToClient = async (doc: any) => {
    if (!user) return;
    setSendingId(doc.id);
    try {
      const profile = profiles.find((p: any) => p.user_id === doc.uploaded_by);
      const clientEmail = profile?.email;
      if (!clientEmail) { toast({ title: "No email found", description: "Client profile has no email address.", variant: "destructive" }); setSendingId(null); return; }

      const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 604800);
      const downloadLink = signedData?.signedUrl || "#";
      const verification = verificationByDoc[doc.id];
      const verifyLink = verification ? `${window.location.origin}/verify/${verification.id}` : null;

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <h2 style="color:#1a2744;">Your Notarized Document is Ready</h2>
          <p>Hello ${profile?.full_name || "Client"},</p>
          <p>Your notarized document <strong>${doc.file_name}</strong> is ready for download.</p>
          <p><a href="${downloadLink}" style="display:inline-block;padding:12px 24px;background:#1a2744;color:#e8d5a3;text-decoration:none;border-radius:6px;font-weight:600;">Download Document</a></p>
          ${verifyLink ? `<p style="margin-top:16px;font-size:13px;">Verify authenticity: <a href="${verifyLink}">${verifyLink}</a></p>` : ""}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="font-size:12px;color:#9ca3af;">Notar Notary Services · Franklin County, Ohio</p>
        </div>`;

      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("send-correspondence", {
        headers: { Authorization: `Bearer ${session?.session?.access_token}` },
        body: {
          to_address: clientEmail,
          subject: `Your Notarized Document: ${doc.file_name}`,
          body: htmlBody,
          client_id: doc.uploaded_by,
        },
      });
      if (error) throw error;
      toast({ title: "Document sent to client", description: `Email sent to ${clientEmail}` });
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
    setSendingId(null);
  };

  const openPreview = async (doc: any) => {
    setPreviewDoc(doc);
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
    setPreviewUrl(data?.signedUrl || null);
    if (user) {
      supabase.from("audit_log").insert({
        user_id: user.id, action: "admin_document_view", entity_type: "document",
        entity_id: doc.id, details: { file_name: doc.file_name, uploader: doc.uploaded_by },
      }).then(() => {});
    }
  };

  if (loading) return <div className="space-y-6"><div className="mb-6"><Skeleton className="h-8 w-48" /></div><TableSkeleton rows={8} cols={5} /></div>;

  return (
    <div ref={ref}>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-sans text-2xl font-bold text-foreground">Document Management</h1>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

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
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v === "all" ? "" : v); setPage(0); }}>
            <SelectTrigger className="w-36"><Tag className="mr-1 h-3 w-3" /><SelectValue placeholder="All Tags" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
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
            const thumb = thumbnailUrls[doc.id];
            return (
              <Card key={doc.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {thumb ? (
                      <img src={thumb} alt={doc.file_name} className="h-10 w-10 rounded object-cover flex-shrink-0 border border-border" />
                    ) : isPdfFile(doc.file_name) ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-destructive/10 flex-shrink-0">
                        <FileText className="h-5 w-5 text-destructive" />
                      </div>
                    ) : (
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate" title={doc.file_name}>{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{getUploaderName(doc.uploaded_by)}</span>
                        {" · "}{new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {doc.appointment_id && <span className="ml-2">• Linked</span>}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {(tagsByDoc[doc.id] || []).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                            {tag}
                            <button onClick={(e) => { e.stopPropagation(); removeTag(doc.id, tag); }} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                          </Badge>
                        ))}
                        <form className="inline-flex" onSubmit={(e) => { e.preventDefault(); addTag(doc.id); }}>
                          <Input
                            value={tagInput[doc.id] || ""}
                            onChange={(e) => setTagInput(prev => ({ ...prev, [doc.id]: e.target.value }))}
                            placeholder="+ tag"
                            className="h-5 w-16 text-[10px] px-1 border-dashed"
                          />
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => openPreview(doc)}><Eye className="mr-1 h-3 w-3" /> Preview</Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => downloadDocument(doc)}><Download className="mr-1 h-3 w-3" /> Download</Button>
                    {doc.status === "notarized" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => sendToClient(doc)} disabled={sendingId === doc.id}>
                        {sendingId === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />} Send to Client
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{doc.file_name}"? This will remove the file from storage and cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                            setDeletingId(doc.id);
                            await supabase.storage.from("documents").remove([doc.file_path]);
                            const { error } = await supabase.from("documents").delete().eq("id", doc.id);
                            if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
                            else {
                              await supabase.from("audit_log").insert({ user_id: user?.id, action: "document_deleted", entity_type: "document", entity_id: doc.id, details: { file_name: doc.file_name } });
                              toast({ title: "Document deleted" });
                              fetchDocs();
                            }
                            setDeletingId(null);
                          }}>
                            {deletingId === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader><DialogTitle className="font-sans">{previewDoc?.file_name}</DialogTitle></DialogHeader>
          {previewUrl ? (
            previewDoc?.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewUrl} alt={previewDoc.file_name} className="max-h-[65vh] w-full object-contain rounded" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[65vh] rounded border border-border" title="Document Preview" />
            )
          ) : (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-sans">Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Assign to Client (optional)</Label>
              <Select value={uploadClientId} onValueChange={setUploadClientId}>
                <SelectTrigger><SelectValue placeholder="Admin (self)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__self__">Admin (self)</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default AdminDocuments;
