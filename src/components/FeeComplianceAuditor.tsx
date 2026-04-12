import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

type FeeAuditLine = {
  description: string;
  amount: number;
  maxAllowed?: number;
  statute?: string;
};

interface FeeComplianceAuditorProps {
  lines: FeeAuditLine[];
}

/**
 * Validates fees against Ohio statutory limits per ORC §147.08.
 */
export function FeeComplianceAuditor({ lines }: FeeComplianceAuditorProps) {
  const results = useMemo(() => {
    return lines.map(line => {
      const overMax = line.maxAllowed !== undefined && line.amount > line.maxAllowed;
      return { ...line, overMax };
    });
  }, [lines]);

  const total = results.reduce((s, l) => s + l.amount, 0);
  const hasViolation = results.some(r => r.overMax);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Scale className="h-4 w-4" /> Fee Compliance Audit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.map((line, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {line.overMax ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span>{line.description}</span>
              {line.statute && <Badge variant="outline" className="text-[9px]">{line.statute}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <span className={line.overMax ? "text-red-600 font-semibold" : ""}>${line.amount.toFixed(2)}</span>
              {line.maxAllowed !== undefined && (
                <span className="text-[10px] text-muted-foreground">max ${line.maxAllowed.toFixed(2)}</span>
              )}
            </div>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {hasViolation && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-xs text-red-600">
            <AlertTriangle className="h-4 w-4" />
            One or more fees exceed Ohio statutory limits. Review required before charging.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
