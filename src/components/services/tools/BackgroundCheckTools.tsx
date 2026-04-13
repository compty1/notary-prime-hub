import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, FileText, AlertTriangle } from "lucide-react";

const CHECK_TYPES = [
  { type: "FBI Criminal History", turnaround: "3-5 business days", cost: "$18", fingerprints: true, notes: "National criminal database. Requires FD-258 fingerprint card." },
  { type: "Ohio BCI&I", turnaround: "2-4 business days", cost: "$22-$32", fingerprints: true, notes: "Ohio Bureau of Criminal Investigation. WebCheck or ink card." },
  { type: "County Court Records", turnaround: "1-3 business days", cost: "$15-$25", fingerprints: false, notes: "Search specific county court records." },
  { type: "National Sex Offender", turnaround: "Instant", cost: "$0 (public)", fingerprints: false, notes: "Free public search via NSOPW.gov." },
  { type: "Employment Verification", turnaround: "3-7 business days", cost: "$25-$50", fingerprints: false, notes: "Verify dates, title, and salary with prior employers." },
  { type: "Education Verification", turnaround: "3-10 business days", cost: "$15-$30", fingerprints: false, notes: "Verify degrees and attendance." },
  { type: "Credit Check", turnaround: "Instant", cost: "$10-$30", fingerprints: false, notes: "Requires written consent. FCRA compliant." },
  { type: "Motor Vehicle Records", turnaround: "1-3 business days", cost: "$10-$15", fingerprints: false, notes: "Driving history, violations, license status." },
];

const COMPLIANCE_RULES = [
  { rule: "Written consent required before running any check", regulation: "FCRA", critical: true },
  { rule: "Provide applicant copy of report and rights summary", regulation: "FCRA", critical: true },
  { rule: "Pre-adverse action notice before negative decision", regulation: "FCRA", critical: true },
  { rule: "Results must be used only for stated purpose", regulation: "FCRA", critical: true },
  { rule: "Retain records per state retention requirements", regulation: "Ohio", critical: false },
  { rule: "Cannot discriminate based on arrest records (EEOC)", regulation: "EEOC", critical: true },
  { rule: "Ban-the-box compliance for public employers", regulation: "Ohio", critical: false },
];

export function BackgroundCheckTools() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Background Check Types & Turnaround</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CHECK_TYPES.map(c => (
              <div key={c.type} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{c.type}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{c.turnaround}</Badge>
                    <span className="text-xs font-mono">{c.cost}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.fingerprints && <Badge className="bg-primary/10 text-primary text-[10px]">Fingerprints Required</Badge>}
                  <span className="text-xs text-muted-foreground">{c.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> FCRA & Compliance Requirements</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {COMPLIANCE_RULES.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <FileText className={`h-4 w-4 shrink-0 ${r.critical ? "text-red-500" : "text-muted-foreground"}`} />
                <span className="flex-1">{r.rule}</span>
                <Badge variant="outline" className="text-[10px]">{r.regulation}</Badge>
                {r.critical && <Badge variant="destructive" className="text-[10px] px-1">Required</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
