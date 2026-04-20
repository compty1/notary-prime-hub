/**
 * Admin compliance checklist for notary page approval.
 * Displays required and optional items that must be verified.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { APPROVAL_CHECKLIST } from "@/lib/notaryApproval";

interface ComplianceChecklistProps {
  onComplete?: (allPassed: boolean) => void;
  readOnly?: boolean;
  initialChecks?: Record<string, boolean>;
}

export function ComplianceChecklist({ onComplete, readOnly, initialChecks }: ComplianceChecklistProps) {
  const [checks, setChecks] = useState<Record<string, boolean>>(initialChecks || {});

  const requiredItems = APPROVAL_CHECKLIST.filter(i => i.required);
  const optionalItems = APPROVAL_CHECKLIST.filter(i => !i.required);
  const allRequiredPassed = requiredItems.every(i => checks[i.id]);
  const totalChecked = Object.values(checks).filter(Boolean).length;

  const toggle = (id: string) => {
    if (readOnly) return;
    const updated = { ...checks, [id]: !checks[id] };
    setChecks(updated);
    
    const allRequired = requiredItems.every(i => updated[i.id]);
    onComplete?.(allRequired);
  };

  return (
    <Card className="rounded-2xl border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Shield className="h-5 w-5 text-primary" />
            Compliance Checklist
          </CardTitle>
          <Badge variant={allRequiredPassed ? "default" : "outline"} className="gap-1">
            {allRequiredPassed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {totalChecked}/{APPROVAL_CHECKLIST.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Required</h4>
          <div className="space-y-2">
            {requiredItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <Checkbox
                  checked={!!checks[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  disabled={readOnly}
                />
                <span className={`text-sm ${checks[item.id] ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                <Badge variant="outline" className="ml-auto text-[10px]">Required</Badge>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Optional</h4>
          <div className="space-y-2">
            {optionalItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <Checkbox
                  checked={!!checks[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  disabled={readOnly}
                />
                <span className={`text-sm ${checks[item.id] ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {!readOnly && (
          <div className="pt-2">
            {allRequiredPassed ? (
              <p className="text-sm text-success flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> All required items verified
              </p>
            ) : (
              <p className="text-sm text-warning flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> {requiredItems.filter(i => !checks[i.id]).length} required item(s) remaining
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
