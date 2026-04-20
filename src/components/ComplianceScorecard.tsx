import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";

type ComplianceCheck = {
  id: string;
  name: string;
  category: "ohio_ron" | "security" | "data_privacy" | "record_keeping";
  status: "pass" | "fail" | "warning";
  detail?: string;
};

const CHECKS: ComplianceCheck[] = [
  { id: "1", name: "KBA 2-attempt limit enforced", category: "ohio_ron", status: "pass" },
  { id: "2", name: "Recording consent captured", category: "ohio_ron", status: "pass" },
  { id: "3", name: "Journal entries for all acts", category: "ohio_ron", status: "warning", detail: "3 appointments missing journal" },
  { id: "4", name: "E-seal on all notarized docs", category: "ohio_ron", status: "pass" },
  { id: "5", name: "Session recording stored 10yr", category: "ohio_ron", status: "pass" },
  { id: "6", name: "RLS on all tables", category: "security", status: "pass" },
  { id: "7", name: "MFA enforced for admin", category: "security", status: "pass" },
  { id: "8", name: "Audit log active", category: "security", status: "pass" },
  { id: "9", name: "Consent versioning", category: "data_privacy", status: "pass" },
  { id: "10", name: "Data deletion workflow", category: "data_privacy", status: "pass" },
  { id: "11", name: "PII masking in logs", category: "data_privacy", status: "warning", detail: "Email shown in some logs" },
  { id: "12", name: "Document retention policy", category: "record_keeping", status: "pass" },
];

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-4 w-4 text-success" />,
  fail: <XCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  ohio_ron: "Ohio RON Compliance",
  security: "Security Controls",
  data_privacy: "Data Privacy",
  record_keeping: "Record Keeping",
};

export function ComplianceScorecard() {
  const score = useMemo(() => {
    const passed = CHECKS.filter(c => c.status === "pass").length;
    return Math.round((passed / CHECKS.length) * 100);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, ComplianceCheck[]> = {};
    CHECKS.forEach(c => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Compliance Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold">{score}%</span>
          <Progress value={score} className="flex-1 h-3" />
          <Badge variant={score >= 90 ? "default" : score >= 70 ? "secondary" : "destructive"}>
            {score >= 90 ? "Compliant" : score >= 70 ? "Partial" : "Non-Compliant"}
          </Badge>
        </div>

        {Object.entries(grouped).map(([cat, checks]) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{CATEGORY_LABELS[cat]}</h4>
            <div className="space-y-1">
              {checks.map(check => (
                <div key={check.id} className="flex items-center gap-2 text-sm">
                  {STATUS_ICON[check.status]}
                  <span className="flex-1">{check.name}</span>
                  {check.detail && <span className="text-xs text-muted-foreground">{check.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
