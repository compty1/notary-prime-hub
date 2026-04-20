/**
 * SVC-122: Document redaction UI with audit trail
 * Allows marking regions for redaction with tracking
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EyeOff, Plus, Trash2, Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RedactionEntry {
  id: string;
  pageNumber: number;
  fieldName: string;
  reason: string;
  createdAt: string;
}

interface RedactionUIProps {
  documentId: string;
  documentName: string;
}

export function RedactionUI({ documentId, documentName }: RedactionUIProps) {
  const [redactions, setRedactions] = useState<RedactionEntry[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [fieldName, setFieldName] = useState("");
  const [reason, setReason] = useState("");

  const addRedaction = () => {
    if (!fieldName.trim() || !reason.trim()) {
      toast.error("Field name and reason are required");
      return;
    }

    const entry: RedactionEntry = {
      id: crypto.randomUUID(),
      pageNumber,
      fieldName: fieldName.trim(),
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };

    setRedactions(prev => [...prev, entry]);
    setFieldName("");
    setReason("");
    toast.success("Redaction mark added");
  };

  const removeRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
  };

  const applyRedactions = async () => {
    if (redactions.length === 0) {
      toast.error("No redactions to apply");
      return;
    }

    // Log the redaction action to audit trail
    await supabase.from("audit_log").insert({
      action: "document.redaction_applied",
      entity_type: "document",
      entity_id: documentId,
      details: {
        document_name: documentName,
        redaction_count: redactions.length,
        redactions: redactions.map(r => ({
          page: r.pageNumber,
          field: r.fieldName,
          reason: r.reason,
        })),
      },
    });

    toast.success(`${redactions.length} redaction(s) logged for ${documentName}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <EyeOff className="h-5 w-5" /> Redaction Manager
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" /> {documentName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Page #</Label>
            <Input type="number" min={1} value={pageNumber} onChange={e => setPageNumber(Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Field / Area</Label>
            <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="e.g., SSN, Date of Birth" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Redaction Reason</Label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., PII protection per client request" rows={2} />
        </div>
        <Button size="sm" onClick={addRedaction} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Add Redaction Mark
        </Button>

        {redactions.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Pending Redactions ({redactions.length})</p>
            {redactions.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div>
                  <Badge variant="outline" className="mr-2">Page {r.pageNumber}</Badge>
                  <span className="font-medium">{r.fieldName}</span>
                  <span className="text-muted-foreground ml-2">— {r.reason}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() = aria-label="Action"> removeRedaction(r.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <Button onClick={applyRedactions} className="w-full" size="sm">
              <Shield className="mr-1 h-4 w-4" /> Apply & Log Redactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
