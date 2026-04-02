import React, { useRef, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Eye, Sparkles, RefreshCw, Loader2, ShieldCheck, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const docStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  notarized: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/tiff", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPTED_EXTENSIONS = ".pdf, .jpg, .jpeg, .png, .tiff, .doc, .docx";

interface Props {
  userId: string;
  documents: any[];
  setDocuments: React.Dispatch<React.SetStateAction<any[]>>;
  upcomingAppointments: any[];
  onExplainDocument: (doc: any) => void;
}

export default function PortalDocumentsTab({ userId, documents, setDocuments, upcomingAppointments, onExplainDocument }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) =>
      d.file_name?.toLowerCase().includes(q) ||
      d.status?.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { toast({ title: "File too large", description: `${file.name} exceeds 20MB limit.`, variant: "destructive" }); continue; }
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|tiff?|docx?)$/i)) { toast({ title: "Unsupported file type", description: `Accepted formats: ${ACCEPTED_EXTENSIONS}`, variant: "destructive" }); continue; }
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); continue; }
      const { data: docData, error: insertError } = await supabase.from("documents").insert({ uploaded_by: userId, file_name: file.name, file_path: filePath, status: "uploaded" as any }).select().single();
      if (insertError) toast({ title: "Error", description: insertError.message, variant: "destructive" });
      else if (docData) setDocuments(prev => [docData, ...prev]);
    }
    toast({ title: "Documents uploaded", description: `${files.length} file(s) uploaded successfully.` });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadDocument = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
    if (error) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click(); URL.revokeObjectURL(url);
  };

  const replaceDocument = (doc: any) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ACCEPTED_EXTENSIONS;
    input.onchange = async (ev) => {
      const target = ev.target as HTMLInputElement;
      const newFile = target.files?.[0];
      if (!newFile) return;
      if (newFile.size > 20 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
      await supabase.storage.from("documents").remove([doc.file_path]);
      const newPath = `${userId}/${Date.now()}_${newFile.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(newPath, newFile);
      if (upErr) { toast({ title: "Replace failed", description: upErr.message, variant: "destructive" }); return; }
      const { error: dbErr } = await supabase.from("documents").update({ file_name: newFile.name, file_path: newPath }).eq("id", doc.id);
      if (dbErr) { toast({ title: "Update failed", description: dbErr.message, variant: "destructive" }); return; }
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, file_name: newFile.name, file_path: newPath } : d));
      toast({ title: "Document replaced", description: newFile.name });
    };
    input.click();
  };

  const notarizedDocs = documents.filter(d => d.status === "notarized");
  const otherDocs = documents.filter(d => d.status !== "notarized");

  return (
    <div className="space-y-6"
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-primary/5 px-12 py-16 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <p className="text-lg font-semibold text-foreground">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">PDF, JPG, PNG, TIFF, DOC, DOCX (max 20MB)</p>
          </div>
        </div>
      )}
      {/* Notarized Documents Section */}
      {notarizedDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" /> Notarized Documents
          </h3>
          {notarizedDocs.map(doc => (
            <Card key={doc.id} className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img src="/images/notary-seal.png" alt="Notary Seal" className="h-10 w-10 rounded-full object-contain border border-primary/20 bg-background p-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Notarized {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={async () => { const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }} title="Preview"><Eye className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}><Download className="h-3 w-3 mr-1" /> Download</Button>
                  <Badge className="bg-primary/10 text-primary text-xs"><ShieldCheck className="mr-1 h-3 w-3" /> Notarized</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xl font-semibold">My Documents</h2>
        <div>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS} className="hidden" onChange={handleFileUpload} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />} Upload Documents
          </Button>
        </div>
      </div>
      {otherDocs.length === 0 && notarizedDocs.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-0">
          <EmptyState
            icon="documents"
            title="No documents uploaded yet"
            description="Upload your documents to get started with the notarization process."
            actionLabel="Upload Documents"
            onAction={() => fileInputRef.current?.click()}
          />
        </CardContent></Card>
      ) : otherDocs.length === 0 ? null : (
        <div className="space-y-3">
          {documents.map(doc => (
            <Card key={doc.id} className="border-border/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}{doc.appointment_id && <span className="ml-1 text-primary">• Linked to appointment</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={async () => { const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }} title="Preview"><Eye className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onExplainDocument(doc)} title="AI Explain"><Sparkles className="h-3 w-3" /></Button>
                  {!doc.appointment_id && upcomingAppointments.length > 0 && (
                    <Select onValueChange={async apptId => {
                      const { error } = await supabase.from("documents").update({ appointment_id: apptId }).eq("id", doc.id);
                      if (error) toast({ title: "Error", variant: "destructive" });
                      else { toast({ title: "Document linked to appointment" }); setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, appointment_id: apptId } : d)); }
                    }}>
                      <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue placeholder="Attach..." /></SelectTrigger>
                      <SelectContent>{upcomingAppointments.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.service_type.substring(0, 20)} — {new Date(a.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  <Badge className={docStatusColors[doc.status] || "bg-muted text-muted-foreground"}>{doc.status.replace(/_/g, " ")}</Badge>
                  <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}><Download className="h-3 w-3" /></Button>
                  {doc.status === "uploaded" && <Button size="sm" variant="outline" className="text-xs" onClick={() => replaceDocument(doc)}><RefreshCw className="h-3 w-3" /></Button>}
                  {doc.status === "uploaded" && (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
                      if (deletingDocId) return;
                      setDeletingDocId(doc.id);
                      await supabase.storage.from("documents").remove([doc.file_path]);
                      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
                      if (!error) { setDocuments(prev => prev.filter(d => d.id !== doc.id)); toast({ title: "Document deleted" }); }
                      setDeletingDocId(null);
                    }}>✕</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
