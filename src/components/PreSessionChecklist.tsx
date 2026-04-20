import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  notes?: string;
};

type TemplateKey = "general_notarization" | "ron_session" | "loan_signing" | "apostille";

const TEMPLATES: Record<TemplateKey, ChecklistItem[]> = {
  general_notarization: [
    { id: "id_verify", label: "Verify signer identity (valid government-issued photo ID)", required: true, completed: false },
    { id: "willingness", label: "Confirm signer willingness and awareness", required: true, completed: false },
    { id: "doc_review", label: "Review document for blanks and completeness", required: true, completed: false },
    { id: "journal", label: "Complete journal entry per ORC §147.55", required: true, completed: false },
    { id: "seal", label: "Apply notary seal/stamp", required: true, completed: false },
    { id: "certificate", label: "Complete notarial certificate", required: true, completed: false },
    { id: "fee_collect", label: "Collect notary fee (max $5 per act — ORC §147.08)", required: false, completed: false },
  ],
  ron_session: [
    { id: "tech_check", label: "Audio/video technology check", required: true, completed: false },
    { id: "recording_consent", label: "Obtain recording consent (ORC §147.63)", required: true, completed: false },
    { id: "kba", label: "Knowledge-Based Authentication (max 2 attempts — ORC §147.66)", required: true, completed: false },
    { id: "credential_analysis", label: "Credential analysis of ID document", required: true, completed: false },
    { id: "id_verify", label: "Visual ID comparison via video", required: true, completed: false },
    { id: "doc_present", label: "Present document to signer on screen", required: true, completed: false },
    { id: "e_signature", label: "Signer applies electronic signature", required: true, completed: false },
    { id: "e_seal", label: "Apply electronic notary seal", required: true, completed: false },
    { id: "journal", label: "Complete electronic journal entry", required: true, completed: false },
    { id: "recording_save", label: "Save session recording (10-year retention)", required: true, completed: false },
  ],
  loan_signing: [
    { id: "id_verify", label: "Verify all signers' identities", required: true, completed: false },
    { id: "package_review", label: "Review loan package completeness", required: true, completed: false },
    { id: "deed_of_trust", label: "Notarize Deed of Trust", required: true, completed: false },
    { id: "right_to_cancel", label: "Explain Right to Cancel (if applicable)", required: true, completed: false },
    { id: "all_signatures", label: "Obtain all required signatures and initials", required: true, completed: false },
    { id: "journal", label: "Complete journal entries", required: true, completed: false },
    { id: "ship_back", label: "Arrange return shipping to title company", required: false, completed: false },
  ],
  apostille: [
    { id: "doc_type", label: "Verify document type is eligible for apostille", required: true, completed: false },
    { id: "notarize", label: "Notarize document if required", required: false, completed: false },
    { id: "sos_submit", label: "Submit to Ohio Secretary of State", required: true, completed: false },
    { id: "fee_paid", label: "Apostille fee paid ($5 per document)", required: true, completed: false },
    { id: "tracking", label: "Record tracking number", required: false, completed: false },
    { id: "return_client", label: "Return apostilled document to client", required: true, completed: false },
  ],
};

interface PreSessionChecklistProps {
  templateKey?: TemplateKey;
  onComplete?: (allDone: boolean) => void;
}

export function PreSessionChecklist({ templateKey = "general_notarization", onComplete }: PreSessionChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(TEMPLATES[templateKey]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>(templateKey);

  const toggleItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
      const allRequired = updated.filter(i => i.required).every(i => i.completed);
      onComplete?.(allRequired);
      return updated;
    });
  };

  const switchTemplate = (key: TemplateKey) => {
    setSelectedTemplate(key);
    setItems(TEMPLATES[key]);
    onComplete?.(false);
  };

  const requiredCount = items.filter(i => i.required).length;
  const completedRequired = items.filter(i => i.required && i.completed).length;
  const allRequiredDone = completedRequired === requiredCount;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" /> Session Checklist
        </CardTitle>
        <Select value={selectedTemplate} onValueChange={(v) => switchTemplate(v as TemplateKey)}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general_notarization">General Notarization</SelectItem>
            <SelectItem value="ron_session">RON Session</SelectItem>
            <SelectItem value="loan_signing">Loan Signing</SelectItem>
            <SelectItem value="apostille">Apostille</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={allRequiredDone ? "default" : "secondary"} className="text-[10px]">
            {completedRequired}/{requiredCount} required
          </Badge>
          {allRequiredDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {items.map(item => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                  item.completed ? "bg-green-500/5 border-green-500/20" : "hover:bg-muted/50"
                }`}
                onClick={() => toggleItem(item.id)}
              >
                <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  item.completed ? "bg-green-500 border-green-500 text-primary-foreground" : "border-muted-foreground"
                }`}>
                  {item.completed && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.label}
                  </span>
                  {item.required && !item.completed && (
                    <Badge variant="outline" className="ml-2 text-[9px]">Required</Badge>
                  )}
                </div>
              </label>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
