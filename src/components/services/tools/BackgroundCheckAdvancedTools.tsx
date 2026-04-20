import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle, Database } from "lucide-react";

const CHECK_TYPES = [
  { type: "FBI Criminal History", method: "Fingerprint (FD-258)", turnaround: "3-5 business days", fee: "$18", desc: "National criminal history from FBI CJIS database" },
  { type: "BCI&I (Ohio)", method: "Fingerprint (WebCheck)", turnaround: "1-3 business days", fee: "$22", desc: "Ohio Bureau of Criminal Investigation state check" },
  { type: "National Criminal Search", method: "Name/DOB search", turnaround: "1-2 business days", fee: "$15-30", desc: "Multi-jurisdictional database search" },
  { type: "County Criminal Search", method: "Court records", turnaround: "2-5 business days", fee: "$10-25/county", desc: "Direct courthouse records search" },
  { type: "Sex Offender Registry", method: "Name search", turnaround: "Instant-1 day", fee: "$5-10", desc: "National Sex Offender Public Website (NSOPW)" },
  { type: "Employment Verification", method: "Employer contact", turnaround: "2-5 business days", fee: "$15-25", desc: "Verify dates of employment, position, salary" },
  { type: "Education Verification", method: "Institution contact", turnaround: "3-7 business days", fee: "$15-25", desc: "Verify degrees, dates attended, GPA" },
  { type: "Credit Report", method: "SSN-based", turnaround: "Instant", fee: "$15-30", desc: "Requires written authorization per FCRA" },
];

const FCRA_REQUIREMENTS = [
  { req: "Written consent must be obtained before running check", ref: "15 U.S.C. §1681b(b)(2)" },
  { req: "Clear and conspicuous disclosure required (standalone document)", ref: "15 U.S.C. §1681b(b)(2)(A)" },
  { req: "Pre-adverse action notice must include copy of report", ref: "15 U.S.C. §1681b(b)(3)" },
  { req: "Consumer must receive 'Summary of Rights' document", ref: "15 U.S.C. §1681g(c)" },
  { req: "Adverse action notice required if decision based on report", ref: "15 U.S.C. §1681m(a)" },
  { req: "Records must be retained for minimum 5 years", ref: "FTC Guidelines" },
];

const OHIO_SPECIFIC_RULES = [
  "Ohio WebCheck: State-run electronic fingerprint system for BCI&I checks",
  "Licensed agencies must register with Ohio AG for private investigation",
  "Ban-the-Box: Ohio public employers cannot ask about criminal history on initial application",
  "Expunged records should not appear in properly conducted checks",
  "Ohio ORC §2953.32: Sealed records not to be disclosed except by court order",
];

export function BackgroundCheckAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Background Check Types & Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CHECK_TYPES.map((c) => (
              <div key={c.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{c.type}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{c.turnaround}</Badge>
                    <Badge variant="outline" className="text-xs">{c.fee}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
                <p className="text-xs mt-1"><span className="font-medium">Method:</span> {c.method}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            FCRA Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {FCRA_REQUIREMENTS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{r.req}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{r.ref}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ohio-Specific Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_SPECIFIC_RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
