import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, CheckCircle, XCircle, Loader2, ShieldCheck, ShieldX, ExternalLink } from "lucide-react";

const docStatuses = ["uploaded", "pending_review", "approved", "notarized", "rejected"];

const docStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  notarized: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verificationByDoc, setVerificationByDoc] = useState<Record<string, any>>({});
  const [sealingId, setSealingId] = useState<string | null>(null);

  const fetchDocs = async () => {
    const [docsRes, verificationsRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("e_seal_verifications" as any).select("*")
    ]);

    if (docsRes.data) setDocs(docsRes.data);
    if (verificationsRes.data) {
      const mapped: Record<string, any> = {};
      (verificationsRes.data as any[]).forEach((v: any) => {
        mapped[v.document_id] = v;
      });
      setVerificationByDoc(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("documents").update({ status: newStatus as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document status updated", description: `→ ${newStatus.replace(/_/g, " ")}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id,
        action: "document_status_changed",
        entity_type: "document",
        entity_id: id,
        details: { new_status: newStatus },
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

      const response = await supabase
        .from("e_seal_verifications" as any)
        .insert({
          document_id: doc.id,
          appointment_id: doc.appointment_id || null,
          document_name: doc.file_name,
          signer_name: signerName,
          notarized_at: new Date().toISOString(),
          created_by: user.id,
          status: "valid",
        })
        .select("*")
        .single();

      const data = response.data as any;
      const error = response.error as any;

      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast({ title: "Verification already exists", description: "This document already has an active verification record." });
        } else {
          throw error;
        }
      } else {
        setVerificationByDoc((prev) => ({ ...prev, [doc.id]: data }));
        await supabase.from("audit_log").insert({
          user_id: user.id,
          action: "verification_created",
          entity_type: "e_seal_verification",
          entity_id: data?.id,
          details: { document_id: doc.id },
        });
        toast({ title: "Verification published", description: "Public verification link created." });
      }
    } catch (error: any) {
      toast({ title: "Verification error", description: error.message || "Failed to create verification", variant: "destructive" });
    }
    setSealingId(null);
  };

  const revokeVerification = async (docId: string, verificationId: string) => {
    setSealingId(docId);
    const { error } = await supabase
      .from("e_seal_verifications" as any)
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", verificationId);

    if (error) {
      toast({ title: "Revoke failed", description: error.message, variant: "destructive" });
    } else {
      setVerificationByDoc((prev) => ({ ...prev, [docId]: { ...prev[docId], status: "revoked" } }));
      await supabase.from("audit_log").insert({
        user_id: user?.id,
        action: "verification_revoked",
        entity_type: "e_seal_verification",
        entity_id: verificationId,
      });
      toast({ title: "Verification revoked" });
    }
    setSealingId(null);
  };

  const openVerification = (verificationId: string) => {
    window.open(`/verify/${verificationId}`, "_blank");
  };

  const downloadDocument = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Document Management</h1>

      {docs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Documents uploaded during the booking flow will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const verification = verificationByDoc[doc.id];
            const hasActiveVerification = verification && verification.status === "valid";

            return (
              <Card key={doc.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {doc.appointment_id && <span className="ml-2">• Linked to appointment</span>}
                      </p>
                      {verification && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Verification ID: {verification.id.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => downloadDocument(doc)}>
                      <Download className="mr-1 h-3 w-3" /> Download
                    </Button>

                    {doc.status === "notarized" && !verification && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => generateVerification(doc)}
                        disabled={sealingId === doc.id}
                      >
                        {sealingId === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                        Publish Verify Link
                      </Button>
                    )}

                    {hasActiveVerification && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => openVerification(verification.id)}>
                          <ExternalLink className="mr-1 h-3 w-3" /> View Verify Page
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive"
                          onClick={() => revokeVerification(doc.id, verification.id)}
                          disabled={sealingId === doc.id}
                        >
                          <ShieldX className="mr-1 h-3 w-3" /> Revoke
                        </Button>
                      </>
                    )}

                    <Select value={doc.status} onValueChange={(v) => updateStatus(doc.id, v)}>
                      <SelectTrigger className="w-36">
                        <Badge className={docStatusColors[doc.status] || "bg-muted"}>{doc.status.replace(/_/g, " ")}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {docStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
