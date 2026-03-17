import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";

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

  const fetchDocs = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (data) setDocs(data);
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
            <p className="text-xs text-muted-foreground mt-1">Documents uploaded during the booking flow will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => downloadDocument(doc)}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </Button>
                  {doc.status === "pending_review" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => updateStatus(doc.id, "approved")}
                        disabled={updatingId === doc.id}
                      >
                        {updatingId === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive border-red-200 hover:bg-red-50"
                        onClick={() => updateStatus(doc.id, "rejected")}
                        disabled={updatingId === doc.id}
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Reject
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
          ))}
        </div>
      )}
    </div>
  );
}
