import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, FileText, CheckCircle, AlertTriangle } from "lucide-react";

const SIGNING_STEPS = [
  { step: "Confirm appointment details (address, time, signer names)", critical: true },
  { step: "Print 2 copies of signing package", critical: true },
  { step: "Verify signer identity — government-issued photo ID", critical: true },
  { step: "Confirm correct legal names on all documents", critical: true },
  { step: "Walk through Closing Disclosure / HUD-1", critical: true },
  { step: "Sign Promissory Note", critical: true },
  { step: "Sign Deed of Trust / Mortgage", critical: true },
  { step: "Sign Right to Cancel (if refinance)", critical: true },
  { step: "Initial all pages requiring initials", critical: false },
  { step: "Complete notary acknowledgments", critical: true },
  { step: "Verify all signatures and dates complete", critical: true },
  { step: "Return signed docs to title company within 24hrs", critical: true },
  { step: "Invoice signing service", critical: false },
];

const LOAN_TYPES = [
  { type: "Purchase", rescission: false, docs: "~100-150 pages", avgFee: "$125-$200" },
  { type: "Refinance", rescission: true, docs: "~100-150 pages", avgFee: "$100-$175" },
  { type: "HELOC", rescission: true, docs: "~50-75 pages", avgFee: "$75-$125" },
  { type: "Reverse Mortgage", rescission: true, docs: "~150-200 pages", avgFee: "$150-$250" },
  { type: "Construction Loan", rescission: false, docs: "~75-100 pages", avgFee: "$125-$175" },
  { type: "VA Loan", rescission: false, docs: "~125-175 pages", avgFee: "$125-$200" },
  { type: "FHA Loan", rescission: false, docs: "~125-175 pages", avgFee: "$125-$200" },
];

const COMMON_ERRORS = [
  { error: "Wrong date on documents", impact: "Delays closing, may require re-signing" },
  { error: "Signer signed in wrong spot", impact: "Document rejection, possible re-draw" },
  { error: "Missing initials", impact: "Title company must get corrections" },
  { error: "Notary seal unclear or missing", impact: "Recording rejection" },
  { error: "Documents returned late", impact: "Rate lock may expire" },
  { error: "Did not compare ID name to document name", impact: "Potential fraud or rejection" },
];

export function LoanSigningTools() {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Loan Signing Procedure Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SIGNING_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checkedSteps.has(i)} onCheckedChange={() => {
                  setCheckedSteps(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                }} />
                <span className={checkedSteps.has(i) ? "line-through text-muted-foreground" : ""}>{s.step}</span>
                {s.critical && <Badge variant="destructive" className="text-[10px] px-1">Critical</Badge>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{checkedSteps.size}/{SIGNING_STEPS.length} steps completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Loan Type Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LOAN_TYPES.map(l => (
              <div key={l.type} className="flex items-center justify-between text-sm p-2 rounded border">
                <div>
                  <p className="font-medium">{l.type}</p>
                  <p className="text-xs text-muted-foreground">{l.docs}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{l.avgFee}</span>
                  {l.rescission && <Badge className="bg-warning/10 text-warning text-[10px]">3-day Rescission</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Common Signing Errors</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {COMMON_ERRORS.map((e, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{e.error}</p>
                <p className="text-xs text-muted-foreground">Impact: {e.impact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
