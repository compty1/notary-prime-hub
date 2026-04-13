/**
 * Sprint 1: Document Review Panel
 * Side-by-side view showing original document info + extracted/admin review data.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface DocumentReviewPanelProps {
  document: {
    id: string;
    file_name: string;
    status: string;
    created_at: string;
    document_hash?: string | null;
  };
  onApprove?: (id: string, notes: string) => void;
  onReject?: (id: string, reason: string) => void;
  className?: string;
}

export function DocumentReviewPanel({ document, onApprove, onReject, className }: DocumentReviewPanelProps) {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Document Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">File</span>
            <p className="font-medium truncate">{document.file_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <div><Badge variant="outline">{document.status}</Badge></div>
          </div>
          {document.document_hash && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Hash</span>
              <p className="font-mono text-xs truncate">{document.document_hash}</p>
            </div>
          )}
        </div>

        <Textarea
          placeholder={action === "reject" ? "Reason for rejection..." : "Review notes..."}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onApprove?.(document.id, notes)}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onReject?.(document.id, notes)}
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
