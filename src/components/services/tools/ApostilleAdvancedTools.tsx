import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Globe, Clock, FileText, CheckCircle } from "lucide-react";

const STATE_REQUIREMENTS = [
  { state: "Ohio", office: "Secretary of State", fee: "$10/document", processing: "5-7 business days", expedited: "$20 (24hr)", notes: "Must be notarized by Ohio notary" },
  { state: "California", office: "Secretary of State", fee: "$26/document", processing: "5-10 business days", expedited: "$52 (24hr)", notes: "Authentication may also be required" },
  { state: "New York", office: "County Clerk + DOS", fee: "$10 County + $10 State", processing: "3-5 business days", expedited: "Walk-in available", notes: "Two-step process required" },
  { state: "Texas", office: "Secretary of State", fee: "$15/document", processing: "5-7 business days", expedited: "$30 (24hr)", notes: "Notary acknowledgment required" },
  { state: "Florida", office: "Secretary of State", fee: "$10/document", processing: "5-10 business days", expedited: "$30 (24hr)", notes: "Notarization within Florida required" },
];

const APOSTILLE_CHECKLIST = [
  { step: "Verify document type is eligible", details: "Birth/death certificates, court documents, notarized documents, diplomas" },
  { step: "Confirm notarization is valid", details: "Notary commission active, seal legible, signature matches" },
  { step: "Identify destination country", details: "Must be Hague Convention member; non-members need authentication/legalization" },
  { step: "Prepare cover sheet if required", details: "Some states require a specific cover form" },
  { step: "Submit to Secretary of State", details: "Include payment, return envelope, and tracking number" },
  { step: "Verify apostille received", details: "Check certificate number, date, and destination match" },
  { step: "Arrange consulate legalization if needed", details: "Non-Hague countries require embassy/consulate authentication" },
  { step: "Ship to client with tracking", details: "Use trackable shipping; retain proof of delivery" },
];

const COMMON_REJECTIONS = [
  { reason: "Expired notary commission at time of notarization", fix: "Verify commission was active on the document date" },
  { reason: "Notary seal not legible or missing", fix: "Re-notarize with clear stamp impression" },
  { reason: "Document not notarized (e.g., vital record)", fix: "Attach certified copy certification by custodian" },
  { reason: "Wrong state submission", fix: "Submit to the state where notarization occurred" },
  { reason: "Missing or incorrect fee", fix: "Verify current fee schedule; include exact payment" },
];

export function ApostilleAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            State-by-State Apostille Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">State</th>
                  <th className="text-left p-2 font-medium">Office</th>
                  <th className="text-left p-2 font-medium">Fee</th>
                  <th className="text-left p-2 font-medium">Standard</th>
                  <th className="text-left p-2 font-medium">Expedited</th>
                </tr>
              </thead>
              <tbody>
                {STATE_REQUIREMENTS.map((s) => (
                  <tr key={s.state} className="border-b">
                    <td className="p-2 font-medium">{s.state}</td>
                    <td className="p-2 text-muted-foreground">{s.office}</td>
                    <td className="p-2"><Badge variant="outline" className="text-xs">{s.fee}</Badge></td>
                    <td className="p-2 text-xs text-muted-foreground">{s.processing}</td>
                    <td className="p-2 text-xs text-muted-foreground">{s.expedited}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Apostille Processing Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {APOSTILLE_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium">{item.step}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" />
            Common Rejection Reasons & Fixes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMMON_REJECTIONS.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <p className="text-sm font-medium text-destructive">{r.reason}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <p className="text-xs text-muted-foreground">{r.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
