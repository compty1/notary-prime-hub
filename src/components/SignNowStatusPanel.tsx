import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature, Clock, Eye, CheckCircle, Mail, XCircle } from "lucide-react";

interface SignNowDocument {
  id: string;
  document_name: string;
  signnow_document_id: string;
  status: string;
  invite_sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  completed_at: string | null;
  signnow_emails_sent: Array<{ type: string; sent_at: string; recipient?: string }>;
}

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  draft: { icon: FileSignature, label: "Draft", color: "bg-muted text-muted-foreground" },
  pending: { icon: Clock, label: "Pending Signature", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  viewed: { icon: Eye, label: "Viewed by Signer", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  signed: { icon: CheckCircle, label: "Signed", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  completed: { icon: CheckCircle, label: "Completed", color: "bg-primary/10 text-primary" },
  declined: { icon: XCircle, label: "Declined", color: "bg-destructive/10 text-destructive" },
};

interface SignNowStatusPanelProps {
  appointmentId: string;
  compact?: boolean;
}

export function SignNowStatusPanel({ appointmentId, compact = false }: SignNowStatusPanelProps) {
  const [docs, setDocs] = useState<SignNowDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("signnow_documents")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false });
      setDocs((data as any) || []);
      setLoading(false);
    };
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel(`signnow-${appointmentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "signnow_documents",
        filter: `appointment_id=eq.${appointmentId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setDocs(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setDocs(prev => prev.map(d => d.id === ((payload.new as Record<string, unknown>)).id ? payload.new as any : d));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [appointmentId]);

  if (loading) return null;
  if (docs.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {docs.map(doc => {
          const cfg = statusConfig[doc.status] || statusConfig.draft;
          return (
            <Badge key={doc.id} className={cfg.color}>
              <cfg.icon className="h-3 w-3 mr-1" />
              {doc.document_name || "Document"}: {cfg.label}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          SignNow Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {docs.map(doc => {
          const cfg = statusConfig[doc.status] || statusConfig.draft;
          const Icon = cfg.icon;
          return (
            <div key={doc.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{doc.document_name || "Untitled Document"}</span>
                <Badge className={cfg.color}><Icon className="h-3 w-3 mr-1" /> {cfg.label}</Badge>
              </div>

              {/* Timeline */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {doc.invite_sent_at && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Invited {new Date(doc.invite_sent_at).toLocaleDateString()}
                  </span>
                )}
                {doc.viewed_at && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Viewed {new Date(doc.viewed_at).toLocaleDateString()}
                  </span>
                )}
                {doc.signed_at && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Signed {new Date(doc.signed_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Emails sent by SignNow */}
              {doc.signnow_emails_sent && doc.signnow_emails_sent.length > 0 && (
                <div className="pl-2 border-l-2 border-muted space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">SignNow Emails:</p>
                  {doc.signnow_emails_sent.map((email, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {email.type} — {new Date(email.sent_at).toLocaleString()}
                      {email.recipient && ` → ${email.recipient}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
