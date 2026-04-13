/**
 * LN-002: Loan signing document checklist component
 * Used by notaries during signing sessions to track document completion
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  status: "pending" | "signed" | "initialed" | "na";
}

const DEFAULT_LOAN_DOCS: Omit<ChecklistItem, "status">[] = [
  { id: "deed", label: "Deed of Trust / Mortgage", required: true },
  { id: "note", label: "Promissory Note", required: true },
  { id: "closing", label: "Closing Disclosure", required: true },
  { id: "rpa", label: "Right to Cancel (RTC)", required: true },
  { id: "title", label: "Title Insurance Commitment", required: true },
  { id: "survey", label: "Survey Affidavit", required: false },
  { id: "hazard", label: "Hazard Insurance Declaration", required: true },
  { id: "tax", label: "Tax Information Sheet", required: false },
  { id: "compliance", label: "Compliance Agreement", required: true },
  { id: "occupancy", label: "Occupancy Affidavit", required: true },
  { id: "irs4506", label: "IRS Form 4506-T", required: true },
  { id: "w9", label: "W-9 Request", required: false },
  { id: "error", label: "Errors & Omissions Agreement", required: true },
  { id: "signature", label: "Signature Affidavit", required: true },
  { id: "name", label: "Name Affidavit", required: false },
];

interface LoanSigningChecklistProps {
  appointmentId?: string;
  onSave?: (items: ChecklistItem[]) => void;
}

export function LoanSigningChecklist({ appointmentId, onSave }: LoanSigningChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    DEFAULT_LOAN_DOCS.map((d) => ({ ...d, status: "pending" }))
  );

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "signed" ? "pending" : "signed" }
          : item
      )
    );
  };

  const markNA = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === "na" ? "pending" : "na" } : item
      )
    );
  };

  const completedCount = items.filter((i) => i.status === "signed" || i.status === "na").length;
  const requiredComplete = items
    .filter((i) => i.required)
    .every((i) => i.status === "signed");
  const progress = Math.round((completedCount / items.length) * 100);

  const handleSave = () => {
    if (onSave) onSave(items);
    toast({ title: "Checklist saved", description: `${completedCount}/${items.length} documents completed.` });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" /> Loan Signing Checklist
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={requiredComplete ? "default" : "secondary"}>
            {completedCount}/{items.length}
          </Badge>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                item.status === "signed"
                  ? "bg-primary/10"
                  : item.status === "na"
                  ? "bg-muted opacity-50"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={item.status === "signed"}
                  onCheckedChange={() => toggleItem(item.id)}
                  disabled={item.status === "na"}
                />
                <span className={`text-sm ${item.status === "signed" ? "line-through text-muted-foreground" : ""}`}>
                  {item.label}
                </span>
                {item.required && <Badge variant="outline" className="text-[10px] px-1">Required</Badge>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={() => markNA(item.id)}
              >
                {item.status === "na" ? "Undo N/A" : "N/A"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {requiredComplete ? (
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All required documents signed</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {items.filter((i) => i.required && i.status !== "signed").length} required documents remaining
            </span>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Save Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
