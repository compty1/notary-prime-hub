import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, Scale } from "lucide-react";

const LOAN_PACKAGE_DOCS = [
  { doc: "Deed of Trust / Mortgage", signers: "Borrower(s)", notary: "Acknowledgment", critical: true },
  { doc: "Promissory Note", signers: "Borrower(s)", notary: "Usually not notarized", critical: true },
  { doc: "Closing Disclosure (CD)", signers: "Borrower(s)", notary: "Not notarized", critical: true },
  { doc: "Right to Cancel (Rescission)", signers: "Borrower(s)", notary: "Not notarized", critical: true },
  { doc: "Compliance Agreement", signers: "Borrower(s)", notary: "Acknowledgment", critical: false },
  { doc: "Occupancy Affidavit", signers: "Borrower(s)", notary: "Jurat", critical: false },
  { doc: "Signature/Name Affidavit", signers: "Borrower(s)", notary: "Jurat", critical: false },
  { doc: "1003 Uniform Application", signers: "Borrower(s)", notary: "Sometimes", critical: false },
  { doc: "IRS Form 4506-C", signers: "Borrower(s)", notary: "Not notarized", critical: false },
  { doc: "Title Affidavit", signers: "Borrower(s)", notary: "Jurat", critical: false },
];

const SIGNING_ERRORS = [
  { error: "Wrong date on documents", impact: "Package rejection, funding delay", prevention: "Use date provided by title/lender" },
  { error: "Missing initials/signatures", impact: "Redraw required", prevention: "Use sticky flags on every signature line" },
  { error: "Wrong notary certificate type", impact: "Document re-execution", prevention: "Acknowledgment for deeds, Jurat for affidavits" },
  { error: "Notarizing the Note", impact: "Lender confusion", prevention: "Notes are signed but typically NOT notarized" },
  { error: "Incorrect signer name", impact: "Title issues", prevention: "Match name exactly as printed on documents" },
  { error: "Expired notary commission", impact: "Entire package invalid", prevention: "Check commission expiry before every signing" },
];

const BEST_PRACTICES = [
  "Print and review all documents before arriving at signing",
  "Confirm signer names match exactly with IDs",
  "Use sticky tabs to mark all signature/initial/date lines",
  "Explain the purpose of each document (without legal advice)",
  "Use separate notarial certificates for each document",
  "Ship documents back within 24 hours via overnight delivery",
  "Retain journal entries and copy of signer IDs",
  "Report any suspicious activity to title company immediately",
];

export function LoanSigningAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Loan Package Document Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LOAN_PACKAGE_DOCS.map((d) => (
              <div key={d.doc} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {d.critical && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  <span className="text-sm font-medium">{d.doc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{d.notary}</Badge>
                  {d.critical && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Common Signing Errors & Prevention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SIGNING_ERRORS.map((e) => (
              <div key={e.error} className="p-3 rounded-lg border">
                <p className="text-sm font-medium text-destructive">{e.error}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Impact: {e.impact}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <p className="text-xs">{e.prevention}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Loan Signing Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {BEST_PRACTICES.map((bp, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">{bp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
