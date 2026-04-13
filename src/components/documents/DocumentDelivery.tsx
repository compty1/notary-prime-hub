/**
 * Sprint 1: Document Delivery Component
 * Client-facing download + email delivery for completed documents.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, CheckCircle, Loader2, FileText } from "lucide-react";
import { getSecureDocumentUrl, notifyDocumentReady } from "@/lib/documentDelivery";
import { toast } from "@/hooks/use-toast";

interface DeliverableDoc {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
}

interface DocumentDeliveryProps {
  documents: DeliverableDoc[];
  appointmentId?: string;
  clientEmail?: string;
  className?: string;
}

export function DocumentDelivery({ documents, appointmentId, clientEmail, className }: DocumentDeliveryProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);

  const handleDownload = async (doc: DeliverableDoc) => {
    setDownloading(doc.id);
    const url = await getSecureDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast({ title: "Download failed", variant: "destructive" });
    }
    setDownloading(null);
  };

  const handleNotifyAll = async () => {
    if (!appointmentId || !clientEmail) return;
    setNotifying(true);
    for (const doc of documents) {
      await notifyDocumentReady({
        appointmentId,
        documentId: doc.id,
        clientEmail,
        documentName: doc.file_name,
      });
    }
    toast({ title: "Client notified", description: "Document ready notifications sent." });
    setNotifying(false);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Delivery ({documents.length})
          </CardTitle>
          {appointmentId && clientEmail && (
            <Button size="sm" variant="outline" onClick={handleNotifyAll} disabled={notifying}>
              {notifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
              Notify Client
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{doc.file_name}</p>
              <Badge variant="outline" className="text-[10px] mt-1">{doc.status}</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownload(doc)}
              disabled={downloading === doc.id}
            >
              {downloading === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents ready for delivery</p>
        )}
      </CardContent>
    </Card>
  );
}
