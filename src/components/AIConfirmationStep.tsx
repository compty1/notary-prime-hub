/**
 * SVC-208: AI auto-fill confirmation step before submit
 * Shows AI-populated fields with confidence indicators for human review
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Bot, Edit3 } from "lucide-react";

interface AIField {
  label: string;
  value: string;
  confidence: number; // 0-1
  source: string;
  editable?: boolean;
}

interface AIConfirmationStepProps {
  fields: AIField[];
  onConfirm: () => void;
  onEdit: (fieldIndex: number) => void;
  title?: string;
}

export function AIConfirmationStep({ fields, onConfirm, onEdit, title = "Review AI-Populated Fields" }: AIConfirmationStepProps) {
  const lowConfidenceCount = fields.filter(f => f.confidence < 0.8).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        {lowConfidenceCount > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {lowConfidenceCount} field(s) need your attention (low confidence)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((field, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded border p-3 ${
              field.confidence < 0.8
                ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                : "border-border"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{field.label}</p>
              <p className="text-sm font-medium truncate">{field.value || "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    field.confidence >= 0.9
                      ? "text-green-600 border-green-300"
                      : field.confidence >= 0.7
                      ? "text-amber-600 border-amber-300"
                      : "text-red-600 border-red-300"
                  }`}
                >
                  {Math.round(field.confidence * 100)}% confidence
                </Badge>
                <span className="text-[10px] text-muted-foreground">via {field.source}</span>
              </div>
            </div>
            {field.editable !== false && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(i)} aria-label="Action">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}

        <Button onClick={onConfirm} className="w-full mt-4">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Submit
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          You are responsible for verifying the accuracy of all information before submission.
        </p>
      </CardContent>
    </Card>
  );
}
